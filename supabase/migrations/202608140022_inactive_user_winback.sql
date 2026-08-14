-- Recuperación de usuarios inactivos (roadmap 0.7.0 — Retención).
-- Avisa a quien tiene retos activos pero lleva 3+ días sin ningún
-- check-in, sin repetir el aviso más de una vez por semana.
create or replace function public.notify_inactive_users()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;

  with active_participants as (
    select distinct cp.user_id
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.acceptance = 'ACCEPTED' and c.status = 'ACTIVE'
  ),
  recent_activity as (
    select distinct user_id from public.check_ins
    where submitted_at > now() - interval '3 days'
  ),
  recently_notified as (
    select distinct user_id from public.notifications
    where type = 'INACTIVE_WINBACK' and created_at > now() - interval '7 days'
  )
  insert into public.notifications(user_id, type, title, body, href)
  select ap.user_id, 'INACTIVE_WINBACK', '👋 Te echamos de menos',
    'Llevas días sin aparecer por Pique. Tu círculo sigue sumando puntos sin ti.',
    '/hoy'
  from active_participants ap
  where ap.user_id not in (select user_id from recent_activity)
    and ap.user_id not in (select user_id from recently_notified);

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.notify_inactive_users() from public;
grant execute on function public.notify_inactive_users() to service_role;
