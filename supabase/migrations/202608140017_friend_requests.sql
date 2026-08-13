create policy profiles_friend_read on public.profiles for select using (
  exists(
    select 1 from public.friendships
    where status in ('PENDING', 'ACCEPTED')
      and (
        (requester_id = auth.uid() and addressee_id = profiles.id)
        or (requester_id = profiles.id and addressee_id = auth.uid())
      )
  )
);

create or replace function public.send_friend_request(target_username text)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid; existing public.friendships; result public.friendships;
begin
  select id into target_id from public.profiles where lower(username) = lower(target_username);
  if target_id is null then raise exception 'USER_NOT_FOUND'; end if;
  if target_id = auth.uid() then raise exception 'INVALID_REQUEST'; end if;

  if exists(
    select 1 from public.friendships
    where status = 'BLOCKED'
      and (
        (requester_id = auth.uid() and addressee_id = target_id)
        or (requester_id = target_id and addressee_id = auth.uid())
      )
  ) then raise exception 'USER_BLOCKED'; end if;

  select * into existing from public.friendships
  where requester_id = target_id and addressee_id = auth.uid() and status = 'PENDING';
  if found then
    update public.friendships set status = 'ACCEPTED', updated_at = now()
    where id = existing.id
    returning * into result;
    return result;
  end if;

  insert into public.friendships(requester_id, addressee_id, status)
  values (auth.uid(), target_id, 'PENDING')
  on conflict (requester_id, addressee_id) do update
    set status = 'PENDING', updated_at = now()
  where public.friendships.status = 'REJECTED'
  returning * into result;

  if result.id is null then
    select * into result from public.friendships
    where requester_id = auth.uid() and addressee_id = target_id;
  end if;

  return result;
end;
$$;

revoke all on function public.send_friend_request(text) from public;
grant execute on function public.send_friend_request(text) to authenticated;

create or replace function public.respond_to_friend_request(request_id uuid, response public.friendship_status)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare result public.friendships;
begin
  if response not in ('ACCEPTED', 'REJECTED') then raise exception 'INVALID_RESPONSE'; end if;
  update public.friendships
  set status = response, updated_at = now()
  where id = request_id and addressee_id = auth.uid() and status = 'PENDING'
  returning * into result;
  if result.id is null then raise exception 'NOT_AUTHORIZED'; end if;
  return result;
end;
$$;

revoke all on function public.respond_to_friend_request(uuid, public.friendship_status) from public;
grant execute on function public.respond_to_friend_request(uuid, public.friendship_status) to authenticated;

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
    'Solicitud de amistad',
    coalesce(requester_name, 'Alguien') || ' quiere ser tu amigo en Pique.',
    '/amigos'
  );
  return new;
end;
$$;

drop trigger if exists notify_friend_request on public.friendships;
create trigger notify_friend_request
after insert on public.friendships
for each row execute function public.notify_friend_request();

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
    'Solicitud aceptada',
    coalesce(addressee_name, 'Tu contacto') || ' ha aceptado tu solicitud de amistad.',
    '/amigos'
  );
  return new;
end;
$$;

drop trigger if exists notify_friend_accepted on public.friendships;
create trigger notify_friend_accepted
after update of status on public.friendships
for each row execute function public.notify_friend_accepted();
