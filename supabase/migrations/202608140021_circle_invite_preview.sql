-- Quien recibe un enlace de invitación sin cuenta aterrizaba directo en el
-- login genérico, sin saber a qué círculo ni quién le invita. Esta función
-- expone lo mínimo (nombre del círculo y de quien invita) para un código
-- válido, sin requerir sesión, así se puede mostrar antes de pedir login.
create or replace function public.preview_circle_invite(invite_code text)
returns table (circle_name text, inviter_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select c.name, p.display_name
  from public.circle_invites i
  join public.circles c on c.id = i.circle_id
  join public.profiles p on p.id = i.created_by
  where i.code = upper(invite_code)
    and i.expires_at > now()
    and i.use_count < i.max_uses;
end;
$$;

revoke all on function public.preview_circle_invite(text) from public;
grant execute on function public.preview_circle_invite(text) to anon, authenticated;
