alter table public.notifications add column pushed_at timestamptz;

create index notifications_push_pending_idx on public.notifications (created_at)
where pushed_at is null;

alter table public.challenges add column last_notified_leader_id uuid references public.profiles(id);

create or replace function public.notify_challenge_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare challenge_title text; creator uuid;
begin
  if new.acceptance <> 'ACCEPTED' or old.acceptance = 'ACCEPTED' then return new; end if;
  select title, creator_id into challenge_title, creator
  from public.challenges
  where id = new.challenge_id;

  if creator is null or creator = new.user_id then return new; end if;

  insert into public.notifications(user_id, type, title, body, href)
  values (
    creator,
    'CHALLENGE_ACCEPTED',
    'Reto aceptado',
    'Tu rival ha aceptado el reto «' || coalesce(challenge_title, 'reto') || '».',
    '/retos/' || new.challenge_id::text
  );
  return new;
end;
$$;

drop trigger if exists notify_challenge_response on public.challenge_participants;
create trigger notify_challenge_response
after update of acceptance on public.challenge_participants
for each row execute function public.notify_challenge_response();

create or replace function public.notify_challenge_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'COMPLETED' or old.status = 'COMPLETED' then return new; end if;

  insert into public.notifications(user_id, type, title, body, href)
  select
    participant.user_id,
    'CHALLENGE_FINISHED',
    'Reto finalizado',
    'El reto «' || new.title || '» ha terminado. Revisa el resultado.',
    '/retos/' || new.id::text
  from public.challenge_participants participant
  where participant.challenge_id = new.id
    and participant.acceptance = 'ACCEPTED';
  return new;
end;
$$;

drop trigger if exists notify_challenge_completed on public.challenges;
create trigger notify_challenge_completed
after update of status on public.challenges
for each row execute function public.notify_challenge_completed();

create or replace function public.notify_streak_at_risk()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;

  with candidates as (
    select o.id as occurrence_id, o.participant_id, o.challenge_id, c.title
    from public.goal_occurrences o
    join public.challenge_participants cp
      on cp.challenge_id = o.challenge_id and cp.user_id = o.participant_id
    join public.challenges c on c.id = o.challenge_id
    where o.status = 'PENDING'
      and o.closes_at between now() and now() + interval '3 hours'
      and cp.current_streak > 0
      and not exists (
        select 1 from public.notifications n
        where n.user_id = o.participant_id
          and n.type = 'STREAK_AT_RISK'
          and n.href = '/retos/' || o.challenge_id::text || '?occurrence=' || o.id::text
      )
  )
  insert into public.notifications(user_id, type, title, body, href)
  select participant_id, 'STREAK_AT_RISK', 'Racha en riesgo',
    'Tu racha en «' || title || '» se rompe pronto si no completas hoy.',
    '/retos/' || challenge_id::text || '?occurrence=' || occurrence_id::text
  from candidates;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.notify_occurrence_pending()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;

  with candidates as (
    select o.id as occurrence_id, o.participant_id, o.challenge_id, c.title
    from public.goal_occurrences o
    join public.challenge_participants cp
      on cp.challenge_id = o.challenge_id and cp.user_id = o.participant_id
    join public.challenges c on c.id = o.challenge_id
    where o.status = 'PENDING'
      and o.closes_at between now() and now() + interval '6 hours'
      and cp.current_streak = 0
      and not exists (
        select 1 from public.notifications n
        where n.user_id = o.participant_id
          and n.type = 'OCCURRENCE_PENDING'
          and n.href = '/retos/' || o.challenge_id::text || '?occurrence=' || o.id::text
      )
  )
  insert into public.notifications(user_id, type, title, body, href)
  select participant_id, 'OCCURRENCE_PENDING', 'Objetivo pendiente',
    'Aún puedes completar hoy «' || title || '».',
    '/retos/' || challenge_id::text || '?occurrence=' || occurrence_id::text
  from candidates;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.notify_rival_ahead()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer := 0; challenge record; current_leader uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;

  for challenge in
    select c.id, c.title, c.last_notified_leader_id
    from public.challenges c
    where c.status = 'ACTIVE'
      and (
        select count(*) from public.challenge_participants cp
        where cp.challenge_id = c.id and cp.acceptance = 'ACCEPTED'
      ) >= 2
  loop
    select cp.user_id into current_leader
    from public.challenge_participants cp
    where cp.challenge_id = challenge.id and cp.acceptance = 'ACCEPTED'
    order by cp.score desc, cp.user_id
    limit 1;

    if current_leader is not null and current_leader is distinct from challenge.last_notified_leader_id then
      if challenge.last_notified_leader_id is not null then
        insert into public.notifications(user_id, type, title, body, href)
        select cp.user_id, 'RIVAL_AHEAD', 'Tu rival se ha adelantado',
          'En «' || challenge.title || '» hay nuevo líder. ¡Reacciona!',
          '/retos/' || challenge.id::text
        from public.challenge_participants cp
        where cp.challenge_id = challenge.id
          and cp.acceptance = 'ACCEPTED'
          and cp.user_id <> current_leader;
        inserted_count := inserted_count + 1;
      end if;
      update public.challenges set last_notified_leader_id = current_leader where id = challenge.id;
    end if;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function public.notify_streak_at_risk() from public;
revoke all on function public.notify_occurrence_pending() from public;
revoke all on function public.notify_rival_ahead() from public;
grant execute on function public.notify_streak_at_risk() to service_role;
grant execute on function public.notify_occurrence_pending() to service_role;
grant execute on function public.notify_rival_ahead() to service_role;
