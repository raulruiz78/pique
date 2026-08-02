create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate ~ '^[a-z0-9_]{3,30}$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(candidate)
    );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
