alter table public.circles
  add column if not exists visibility text not null default 'PRIVATE'
  check (visibility in ('PRIVATE', 'PUBLIC'));

alter table public.profiles drop constraint if exists profiles_profile_visibility_check;
alter table public.profiles add constraint profiles_profile_visibility_check
  check (profile_visibility in ('PRIVATE', 'FRIENDS', 'PUBLIC'));

create or replace function public.discover_public_circles()
returns table (
  id uuid,
  name text,
  description text,
  avatar_path text,
  member_count bigint,
  active_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.description,
    c.avatar_path,
    (select count(*) from public.circle_members cm where cm.circle_id = c.id),
    (select count(*) from public.challenges ch where ch.circle_id = c.id and ch.status = 'ACTIVE')
  from public.circles c
  where c.visibility = 'PUBLIC'
    and not public.is_circle_member(c.id, auth.uid())
  order by c.created_at desc
  limit 50;
$$;

create table if not exists public.circle_join_requests (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique(circle_id, user_id)
);

alter table public.circle_join_requests enable row level security;
grant select on public.circle_join_requests to authenticated;
create policy circle_join_request_self_read on public.circle_join_requests for select using (user_id = auth.uid());
create policy circle_join_request_owner_read on public.circle_join_requests for select using (exists(select 1 from public.circles c where c.id = circle_id and c.owner_id = auth.uid()));
create policy profiles_circle_request_owner_read on public.profiles for select using (exists(select 1 from public.circle_join_requests r join public.circles c on c.id = r.circle_id where r.user_id = profiles.id and c.owner_id = auth.uid() and r.status = 'PENDING'));

create or replace function public.request_public_circle_join(target_circle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare request_id uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists(select 1 from public.circles where id = target_circle_id and visibility = 'PUBLIC') then
    raise exception 'CIRCLE_NOT_PUBLIC';
  end if;
  insert into public.circle_join_requests(circle_id, user_id, status, decided_at)
  values (target_circle_id, auth.uid(), 'PENDING', null)
  on conflict(circle_id, user_id) do update set status = 'PENDING', created_at = now(), decided_at = null
  returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.decide_circle_join_request(target_request_id uuid, approve boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare request_row public.circle_join_requests; circle_owner uuid;
begin
  select * into request_row from public.circle_join_requests where id = target_request_id and status = 'PENDING' for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  select owner_id into circle_owner from public.circles where id = request_row.circle_id;
  if circle_owner <> auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  update public.circle_join_requests set status = case when approve then 'APPROVED' else 'REJECTED' end, decided_at = now() where id = target_request_id;
  if approve then insert into public.circle_members(circle_id,user_id,role) values(request_row.circle_id,request_row.user_id,'MEMBER') on conflict do nothing; end if;
  return request_row.circle_id;
end;
$$;

revoke all on function public.discover_public_circles() from public;
revoke all on function public.request_public_circle_join(uuid) from public;
revoke all on function public.decide_circle_join_request(uuid,boolean) from public;
grant execute on function public.discover_public_circles() to authenticated;
grant execute on function public.request_public_circle_join(uuid) to authenticated;
grant execute on function public.decide_circle_join_request(uuid,boolean) to authenticated;
