-- Invitar a un reto nunca generaba notificación/push para el invitado: solo
-- existía un trigger para cuando el rival YA ACEPTABA (notify_challenge_response).
-- Se añade el aviso inicial "te han retado".
create or replace function public.notify_challenge_invite()
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
    'CHALLENGE_INVITE',
    'Te han retado',
    'Tienes una invitación al reto «' || coalesce(challenge_title, 'reto') || '».',
    '/retos/' || new.challenge_id::text
  );
  return new;
end;
$$;

drop trigger if exists notify_challenge_invite on public.challenge_participants;
create trigger notify_challenge_invite
after insert on public.challenge_participants
for each row execute function public.notify_challenge_invite();

revoke all on function public.notify_challenge_invite() from public;
