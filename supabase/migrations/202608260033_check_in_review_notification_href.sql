-- La notificación "Toca validar" (CHECK_IN_REVIEW) llevaba a /hoy en vez
-- de a /validaciones, la página construida justo para revisar evidencias
-- pendientes. Ahora que tocar una notificación navega de verdad (antes
-- solo marcaba leído todo en bloque, nunca una sola), este desvío se
-- notaba: "si tengo que validar un reto, que me mande directamente a la
-- página del reto que tengo que validar".
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
      '/validaciones'
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
