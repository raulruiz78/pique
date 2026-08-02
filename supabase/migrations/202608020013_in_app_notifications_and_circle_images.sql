create or replace function public.can_manage_circle_image(target_circle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circles
    where id = target_circle_id
      and owner_id = auth.uid()
  );
$$;

revoke all on function public.can_manage_circle_image(uuid) from public;
grant execute on function public.can_manage_circle_image(uuid) to authenticated;

drop policy if exists profile_circle_images_insert on storage.objects;
create policy profile_circle_images_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(name))[1] = 'profiles'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] = 'circles'
      and public.can_manage_circle_image(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);

drop policy if exists profile_circle_images_delete on storage.objects;
create policy profile_circle_images_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(name))[1] = 'profiles'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] = 'circles'
      and public.can_manage_circle_image(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);

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
    'Nuevo reto propuesto',
    'Te han propuesto el reto «' || coalesce(challenge_title, 'Nuevo reto') || '». Revisa sus reglas y responde.',
    '/retos/' || new.challenge_id::text
  );
  return new;
end;
$$;

drop trigger if exists notify_challenge_proposal on public.challenge_participants;
create trigger notify_challenge_proposal
after insert on public.challenge_participants
for each row execute function public.notify_challenge_proposal();

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
      'Validación pendiente',
      'Hay una evidencia de «' || coalesce(challenge_title, 'un reto') || '» esperando tu revisión.',
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
      case when new.status = 'APPROVED' then 'Check-in aprobado' else 'Check-in rechazado' end,
      'Tu evidencia de «' || coalesce(challenge_title, 'un reto') || '» ha sido ' ||
        case when new.status = 'APPROVED' then 'aprobada.' else 'rechazada.' end,
      '/retos/' || new.challenge_id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_check_in_insert on public.check_ins;
create trigger notify_check_in_insert
after insert on public.check_ins
for each row execute function public.notify_check_in_changes();

drop trigger if exists notify_check_in_update on public.check_ins;
create trigger notify_check_in_update
after update of status on public.check_ins
for each row execute function public.notify_check_in_changes();

insert into public.notifications(user_id, type, title, body, href)
select
  participant.user_id,
  'CHALLENGE_PROPOSED',
  'Nuevo reto propuesto',
  'Te han propuesto el reto «' || challenge.title || '». Revisa sus reglas y responde.',
  '/retos/' || challenge.id::text
from public.challenge_participants participant
join public.challenges challenge on challenge.id = participant.challenge_id
where participant.acceptance = 'PENDING'
  and not exists (
    select 1 from public.notifications notification
    where notification.user_id = participant.user_id
      and notification.type = 'CHALLENGE_PROPOSED'
      and notification.href = '/retos/' || challenge.id::text
  );

insert into public.notifications(user_id, type, title, body, href)
select
  participant.user_id,
  'CHECK_IN_REVIEW',
  'Validación pendiente',
  'Hay una evidencia de «' || challenge.title || '» esperando tu revisión.',
  '/hoy'
from public.check_ins check_in
join public.challenges challenge on challenge.id = check_in.challenge_id
join public.challenge_participants participant
  on participant.challenge_id = check_in.challenge_id
 and participant.acceptance = 'ACCEPTED'
 and participant.user_id <> check_in.user_id
where check_in.status = 'PENDING_REVIEW'
  and not exists (
    select 1 from public.notifications notification
    where notification.user_id = participant.user_id
      and notification.type = 'CHECK_IN_REVIEW'
      and notification.body like '%' || challenge.title || '%'
      and notification.read_at is null
  );
