-- notify_challenge_invite (202608140018) duplicaba notify_challenge_proposal
-- (ya existente desde 202608020013): ambos disparan en el mismo insert sobre
-- challenge_participants con acceptance = 'PENDING', así que cada invitación
-- generaba dos notificaciones/push idénticas en la práctica. Se retira la
-- añadida de más; la original se queda y adopta el tono nuevo más abajo.
drop trigger if exists notify_challenge_invite on public.challenge_participants;
drop function if exists public.notify_challenge_invite();

-- Copys más juveniles y llamativos para todos los tipos de notificación.

create or replace function public.notify_challenge_proposal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare challenge_title text;
begin
  if new.acceptance <> 'PENDING' then return new; end if;
  select title into challenge_title
  from public.challenges
  where id = new.challenge_id;

  insert into public.notifications(user_id, type, title, body, href)
  values (
    new.user_id,
    'CHALLENGE_PROPOSED',
    '🔥 Te han retado',
    '«' || coalesce(challenge_title, 'Nuevo reto') || '» te espera. ¿Aceptas el pique?',
    '/retos/' || new.challenge_id::text
  );
  return new;
end;
$$;

create or replace function public.notify_check_in_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare challenge_title text;
begin
  select title into challenge_title
  from public.challenges
  where id = new.challenge_id;

  if tg_op = 'INSERT' and new.status = 'PENDING_REVIEW' then
    insert into public.notifications(user_id, type, title, body, href)
    select
      participant.user_id,
      'CHECK_IN_REVIEW',
      '👀 Toca validar',
      'Tu rival ha subido evidencia en «' || coalesce(challenge_title, 'un reto') || '». Dale un vistazo.',
      '/hoy'
    from public.challenge_participants participant
    where participant.challenge_id = new.challenge_id
      and participant.acceptance = 'ACCEPTED'
      and participant.user_id <> new.user_id;
  elsif tg_op = 'UPDATE'
    and old.status = 'PENDING_REVIEW'
    and new.status in ('APPROVED', 'REJECTED') then
    insert into public.notifications(user_id, type, title, body, href)
    values (
      new.user_id,
      case when new.status = 'APPROVED' then 'CHECK_IN_APPROVED' else 'CHECK_IN_REJECTED' end,
      case when new.status = 'APPROVED' then '✅ ¡Validado!' else '❌ Evidencia rechazada' end,
      case when new.status = 'APPROVED'
        then 'Tu evidencia de «' || coalesce(challenge_title, 'un reto') || '» ha pasado el corte. Suma puntos.'
        else 'Tu rival no ha dado el visto bueno en «' || coalesce(challenge_title, 'un reto') || '». Vuelve a intentarlo.'
      end,
      '/retos/' || new.challenge_id::text
    );
  end if;
  return new;
end;
$$;

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
    '🤝 ¡Trato hecho!',
    'Han aceptado tu reto «' || coalesce(challenge_title, 'reto') || '». Que empiece el pique.',
    '/retos/' || new.challenge_id::text
  );
  return new;
end;
$$;

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
    '🏁 Reto terminado',
    '«' || new.title || '» ha llegado a su fin. Ve quién se ha llevado el gato al agua.',
    '/retos/' || new.id::text
  from public.challenge_participants participant
  where participant.challenge_id = new.id
    and participant.acceptance = 'ACCEPTED';
  return new;
end;
$$;

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
  select participant_id, 'STREAK_AT_RISK', '🔥 Tu racha pide auxilio',
    'Como no la líes hoy en «' || title || '», se acaba la racha.',
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
  select participant_id, 'OCCURRENCE_PENDING', '⏰ Aún estás a tiempo',
    'Todavía puedes clavar «' || title || '» hoy.',
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
        select cp.user_id, 'RIVAL_AHEAD', '😬 Te han adelantado',
          'Hay nuevo líder en «' || challenge.title || '». Toca remontar.',
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

create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requester_name text;
begin
  if new.status <> 'PENDING' then return new; end if;
  select display_name into requester_name from public.profiles where id = new.requester_id;

  insert into public.notifications(user_id, type, title, body, href)
  values (
    new.addressee_id,
    'FRIEND_REQUEST',
    '🙋 Nueva solicitud',
    coalesce(requester_name, 'Alguien') || ' quiere piques contigo en Pique.',
    '/amigos'
  );
  return new;
end;
$$;

create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare addressee_name text;
begin
  if new.status <> 'ACCEPTED' or old.status = 'ACCEPTED' then return new; end if;
  select display_name into addressee_name from public.profiles where id = new.addressee_id;

  insert into public.notifications(user_id, type, title, body, href)
  values (
    new.requester_id,
    'FRIEND_ACCEPTED',
    '🎉 ¡Ya sois amigos!',
    coalesce(addressee_name, 'Tu contacto') || ' ha aceptado tu solicitud. A retarse.',
    '/amigos'
  );
  return new;
end;
$$;
