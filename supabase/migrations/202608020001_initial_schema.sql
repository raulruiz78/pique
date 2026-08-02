create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('OWNER', 'ADMIN', 'MEMBER');
create type public.challenge_status as enum ('DRAFT', 'PENDING_ACCEPTANCE', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'DISPUTED');
create type public.challenge_type as enum ('DAILY', 'FREQUENCY', 'CUMULATIVE', 'ONE_VS_ONE', 'GROUP', 'TEAM', 'COOPERATIVE');
create type public.acceptance_status as enum ('PENDING', 'ACCEPTED', 'REJECTED');
create type public.occurrence_status as enum ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED');
create type public.check_in_status as enum ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED', 'EXPIRED');
create type public.validation_type as enum ('SELF', 'PEER_REVIEW', 'MAJORITY');
create type public.validation_decision as enum ('APPROVED', 'REJECTED');
create type public.evidence_type as enum ('PHOTO', 'TEXT', 'VALUE', 'DURATION', 'LINK');
create type public.friendship_status as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
create type public.consequence_status as enum ('PENDING', 'ASSIGNED', 'COMPLETED', 'WAIVED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text,
  timezone text not null default 'Europe/Madrid',
  locale text not null default 'es' check (locale in ('es', 'en')),
  profile_visibility text not null default 'FRIENDS' check (profile_visibility in ('PRIVATE', 'FRIENDS')),
  total_points integer not null default 0,
  current_streak integer not null default 0,
  notification_preferences jsonb not null default '{"inApp":true,"push":false,"email":false,"quietStart":"22:00","quietEnd":"08:00"}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 240),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  code text not null unique default upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 8)),
  max_uses integer not null default 10 check (max_uses between 1 and 100),
  use_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 500),
  rules text not null default '',
  type public.challenge_type not null,
  status public.challenge_status not null default 'DRAFT',
  visibility text not null default 'CIRCLE' check (visibility in ('PRIVATE', 'CIRCLE')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  recurrence text not null,
  validation_type public.validation_type not null default 'PEER_REVIEW',
  evidence_required boolean not null default false,
  version integer not null default 1,
  winner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid,
  acceptance public.acceptance_status not null default 'PENDING',
  accepted_at timestamptz,
  score integer not null default 0,
  position integer,
  current_streak integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  metric text not null default 'BOOLEAN' check (metric in ('BOOLEAN', 'COUNT', 'VALUE', 'DURATION')),
  target numeric not null default 1 check (target > 0),
  unit text not null default 'vez',
  recurrence text not null,
  base_points integer not null check (base_points between 1 and 10000),
  streak_every integer,
  streak_points integer not null default 0,
  evidence_required boolean not null default false,
  evidence_type public.evidence_type,
  created_at timestamptz not null default now()
);

create table public.goal_occurrences (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  closes_at timestamptz not null,
  status public.occurrence_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  check (closes_at > starts_at),
  unique (goal_id, participant_id, starts_at)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null unique references public.goal_occurrences(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value numeric,
  note text check (char_length(note) <= 500),
  status public.check_in_status not null default 'PENDING_REVIEW',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid unique references public.check_ins(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.evidence_type not null,
  storage_path text not null unique check (storage_path !~ '\.\.'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null check (char_length(sha256) = 64),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (owner_id, sha256)
);

create table public.validations (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  decision public.validation_decision not null,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (check_in_id, reviewer_id)
);

create table public.score_transactions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  source_type text not null,
  source_id uuid not null,
  reason text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id, reason)
);

create table public.penalties (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  description text not null check (char_length(description) between 2 and 240),
  assigned_to uuid references public.profiles(id),
  status public.consequence_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  description text not null check (char_length(description) between 2 and 240),
  assigned_to uuid references public.profiles(id),
  status public.consequence_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  public_key text not null,
  auth_secret text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.reactions (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '💪', '👏', '⚡')),
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.idempotency_keys (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  request_hash text not null,
  response_code integer,
  response_body jsonb,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  request_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'OPEN' check (status in ('OPEN', 'REVIEWED', 'CLOSED')),
  created_at timestamptz not null default now()
);

create index circle_members_user_idx on public.circle_members (user_id, circle_id);
create index challenge_participants_user_idx on public.challenge_participants (user_id, challenge_id);
create index challenges_circle_status_idx on public.challenges (circle_id, status);
create index occurrences_participant_date_idx on public.goal_occurrences (participant_id, starts_at);
create index occurrences_challenge_idx on public.goal_occurrences (challenge_id, starts_at);
create index score_challenge_user_idx on public.score_transactions (challenge_id, user_id);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index activities_circle_date_idx on public.activities (circle_id, created_at desc);
create index outbox_pending_idx on public.outbox_events (available_at) where processed_at is null;

create or replace function public.is_circle_member(target_circle_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.circle_members where circle_id = target_circle_id and user_id = target_user_id);
$$;

create or replace function public.is_challenge_participant(target_challenge_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.challenge_participants where challenge_id = target_challenge_id and user_id = target_user_id);
$$;

revoke all on function public.is_circle_member(uuid, uuid) from public;
revoke all on function public.is_challenge_participant(uuid, uuid) from public;
grant execute on function public.is_circle_member(uuid, uuid) to authenticated;
grant execute on function public.is_challenge_participant(uuid, uuid) to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'pique_' || substr(replace(new.id::text, '-', ''), 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Nuevo pique')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.add_circle_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.circle_members(circle_id, user_id, role) values (new.id, new.owner_id, 'OWNER');
  return new;
end;
$$;
create trigger on_circle_created after insert on public.circles for each row execute function public.add_circle_owner();

create or replace function public.create_challenge(payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare created_id uuid := gen_random_uuid(); participant text; circle uuid := (payload ->> 'circleId')::uuid;
begin
  if not public.is_circle_member(circle, auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  if jsonb_array_length(payload -> 'participantIds') < 2 then raise exception 'PARTICIPANTS_REQUIRED'; end if;
  for participant in select jsonb_array_elements_text(payload -> 'participantIds') loop
    if not public.is_circle_member(circle, participant::uuid) then raise exception 'PARTICIPANT_NOT_IN_CIRCLE'; end if;
  end loop;
  insert into public.challenges(id, circle_id, creator_id, title, description, rules, type, status, start_at, end_at, timezone, recurrence, validation_type, evidence_required)
  values (created_id, circle, auth.uid(), payload ->> 'title', coalesce(payload ->> 'description', ''), coalesce(payload ->> 'rules', ''), (payload ->> 'type')::public.challenge_type, 'PENDING_ACCEPTANCE', (payload ->> 'startAt')::timestamptz, (payload ->> 'endAt')::timestamptz, payload ->> 'timezone', payload ->> 'recurrence', (payload ->> 'validationType')::public.validation_type, (payload ->> 'evidenceRequired')::boolean);
  for participant in select jsonb_array_elements_text(payload -> 'participantIds') loop
    insert into public.challenge_participants(challenge_id, user_id, acceptance, accepted_at)
    values (created_id, participant::uuid, case when participant::uuid = auth.uid() then 'ACCEPTED' else 'PENDING' end, case when participant::uuid = auth.uid() then now() else null end);
  end loop;
  insert into public.goals(challenge_id, name, metric, target, unit, recurrence, base_points, evidence_required, evidence_type)
  values (created_id, coalesce(payload ->> 'goalName', payload ->> 'title'), coalesce(payload ->> 'metric', 'BOOLEAN'), coalesce((payload ->> 'target')::numeric, 1), coalesce(payload ->> 'unit', 'vez'), payload ->> 'recurrence', (payload ->> 'points')::integer, (payload ->> 'evidenceRequired')::boolean, case when (payload ->> 'evidenceRequired')::boolean then 'PHOTO'::public.evidence_type else null end);
  if nullif(payload ->> 'consequence', '') is not null then insert into public.penalties(challenge_id, description) values (created_id, payload ->> 'consequence'); end if;
  insert into public.activities(circle_id, challenge_id, actor_id, type, payload) values (circle, created_id, auth.uid(), 'CHALLENGE_CREATED', jsonb_build_object('title', payload ->> 'title'));
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload) values ('challenge', created_id, 'ChallengeCreated', jsonb_build_object('challengeId', created_id));
  return created_id;
end;
$$;

create or replace function public.generate_challenge_occurrences(target_challenge_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare challenge public.challenges; goal public.goals; participant record; day timestamptz; inserted_count integer := 0; code text;
begin
  select * into challenge from public.challenges where id = target_challenge_id;
  select * into goal from public.goals where challenge_id = target_challenge_id order by created_at limit 1;
  for participant in select user_id from public.challenge_participants where challenge_id = target_challenge_id and acceptance = 'ACCEPTED' loop
    for day in select generate_series(date_trunc('day', challenge.start_at), least(date_trunc('day', challenge.end_at), date_trunc('day', challenge.start_at) + interval '29 days'), interval '1 day') loop
      code := (array['SU','MO','TU','WE','TH','FR','SA'])[extract(dow from day)::integer + 1];
      if goal.recurrence like 'FREQ=DAILY%' or goal.recurrence like '%BYDAY=%' || code || '%' then
        insert into public.goal_occurrences(goal_id, challenge_id, participant_id, starts_at, closes_at)
        values (goal.id, challenge.id, participant.user_id, day, day + interval '1 day' - interval '1 second') on conflict do nothing;
        if found then inserted_count := inserted_count + 1; end if;
      end if;
    end loop;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.respond_to_challenge(target_challenge_id uuid, response public.acceptance_status) returns public.challenge_status
language plpgsql security definer set search_path = '' as $$
declare result_status public.challenge_status; challenge public.challenges;
begin
  if response not in ('ACCEPTED', 'REJECTED') then raise exception 'INVALID_RESPONSE'; end if;
  select * into challenge from public.challenges where id = target_challenge_id for update;
  if challenge.status <> 'PENDING_ACCEPTANCE' then raise exception 'CHALLENGE_NOT_PENDING'; end if;
  update public.challenge_participants set acceptance = response, accepted_at = case when response = 'ACCEPTED' then now() else null end where challenge_id = target_challenge_id and user_id = auth.uid();
  if not found then raise exception 'NOT_AUTHORIZED'; end if;
  if response = 'REJECTED' then result_status := 'REJECTED';
  elsif not exists(select 1 from public.challenge_participants where challenge_id = target_challenge_id and acceptance <> 'ACCEPTED') then
    result_status := case when challenge.start_at > now() then 'SCHEDULED' else 'ACTIVE' end;
  else result_status := 'PENDING_ACCEPTANCE'; end if;
  update public.challenges set status = result_status, updated_at = now(), version = version + 1 where id = target_challenge_id;
  if result_status in ('SCHEDULED', 'ACTIVE') then perform public.generate_challenge_occurrences(target_challenge_id); end if;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload) values ('challenge', target_challenge_id, case when response = 'ACCEPTED' then 'ChallengeAccepted' else 'ChallengeRejected' end, jsonb_build_object('challengeId', target_challenge_id, 'userId', auth.uid()));
  return result_status;
end;
$$;

create or replace function public.accept_circle_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare found_invite public.circle_invites;
begin
  select * into found_invite from public.circle_invites
  where code = upper(invite_code) and expires_at > now() and use_count < max_uses for update;
  if not found then raise exception 'INVITE_INVALID'; end if;
  if exists(select 1 from public.friendships where status = 'BLOCKED' and (requester_id = auth.uid() or addressee_id = auth.uid())) then
    raise exception 'USER_BLOCKED';
  end if;
  insert into public.circle_members(circle_id, user_id) values (found_invite.circle_id, auth.uid()) on conflict do nothing;
  update public.circle_invites set use_count = use_count + 1 where id = found_invite.id;
  return found_invite.circle_id;
end;
$$;

create or replace function public.submit_check_in(target_occurrence_id uuid, check_note text default null, check_value numeric default null, evidence_payload jsonb default null)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare occurrence public.goal_occurrences; challenge public.challenges; goal public.goals; created public.check_ins;
begin
  select * into occurrence from public.goal_occurrences where id = target_occurrence_id for update;
  if not found or occurrence.participant_id <> auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  if occurrence.status <> 'PENDING' then raise exception 'OCCURRENCE_ALREADY_USED'; end if;
  if now() < occurrence.starts_at or now() > occurrence.closes_at then raise exception 'OUTSIDE_CHECK_IN_WINDOW'; end if;
  select * into challenge from public.challenges where id = occurrence.challenge_id;
  select * into goal from public.goals where id = occurrence.goal_id;
  if challenge.status <> 'ACTIVE' then raise exception 'CHALLENGE_NOT_ACTIVE'; end if;
  if goal.evidence_required and evidence_payload is null then raise exception 'EVIDENCE_REQUIRED'; end if;
  insert into public.check_ins(occurrence_id, challenge_id, user_id, note, value, status)
  values (occurrence.id, occurrence.challenge_id, auth.uid(), check_note, check_value,
    case when challenge.validation_type = 'SELF' then 'APPROVED'::public.check_in_status else 'PENDING_REVIEW'::public.check_in_status end)
  returning * into created;
  if evidence_payload is not null then
    if evidence_payload ->> 'storagePath' not like auth.uid()::text || '/%' then raise exception 'INVALID_EVIDENCE_PATH'; end if;
    insert into public.evidence(check_in_id, owner_id, type, storage_path, mime_type, size_bytes, sha256)
    values (created.id, auth.uid(), 'PHOTO', evidence_payload ->> 'storagePath', evidence_payload ->> 'mimeType', (evidence_payload ->> 'sizeBytes')::bigint, evidence_payload ->> 'sha256');
  end if;
  update public.goal_occurrences set status = case when challenge.validation_type = 'SELF' then 'APPROVED' else 'SUBMITTED' end where id = occurrence.id;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', created.id, case when challenge.validation_type = 'SELF' then 'CheckInApproved' else 'CheckInSubmitted' end, jsonb_build_object('checkInId', created.id));
  return created;
end;
$$;

create or replace function public.review_check_in(target_check_in_id uuid, review_decision public.validation_decision, review_reason text default null)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare checked public.check_ins; occurrence public.goal_occurrences; goal public.goals; updated public.check_ins;
begin
  select * into checked from public.check_ins where id = target_check_in_id for update;
  if not found or not public.is_challenge_participant(checked.challenge_id, auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  if checked.user_id = auth.uid() then raise exception 'SELF_REVIEW_NOT_ALLOWED'; end if;
  if checked.status <> 'PENDING_REVIEW' then raise exception 'ALREADY_REVIEWED'; end if;
  insert into public.validations(check_in_id, reviewer_id, decision, reason) values (checked.id, auth.uid(), review_decision, review_reason);
  update public.check_ins set status = review_decision::text::public.check_in_status, reviewed_at = now(), updated_at = now(), version = version + 1 where id = checked.id returning * into updated;
  update public.goal_occurrences set status = review_decision::text::public.occurrence_status where id = checked.occurrence_id;
  if review_decision = 'APPROVED' then
    select * into occurrence from public.goal_occurrences where id = checked.occurrence_id;
    select * into goal from public.goals where id = occurrence.goal_id;
    insert into public.score_transactions(challenge_id, user_id, points, source_type, source_id, reason)
    values (checked.challenge_id, checked.user_id, goal.base_points, 'CHECK_IN', checked.id, 'APPROVED') on conflict do nothing;
    if found then
      update public.challenge_participants set score = score + goal.base_points where challenge_id = checked.challenge_id and user_id = checked.user_id;
      update public.challenge_participants set current_streak = current_streak + 1 where challenge_id = checked.challenge_id and user_id = checked.user_id;
      update public.profiles set total_points = total_points + goal.base_points, current_streak = current_streak + 1 where id = checked.user_id;
    end if;
  end if;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', checked.id, case when review_decision = 'APPROVED' then 'CheckInApproved' else 'CheckInRejected' end, jsonb_build_object('checkInId', checked.id));
  return updated;
end;
$$;

create or replace function public.complete_challenge(target_challenge_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare winning_user uuid; losing_user uuid; target_circle uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;
  if not exists(select 1 from public.challenges where id = target_challenge_id and status in ('ACTIVE', 'DISPUTED') and end_at <= now() for update) then return null; end if;
  with stats as (
    select cp.user_id,
      row_number() over (order by cp.score desc,
        (select count(*) from public.check_ins ci where ci.challenge_id = cp.challenge_id and ci.user_id = cp.user_id and ci.status = 'APPROVED') desc,
        (select max(st.created_at) from public.score_transactions st where st.challenge_id = cp.challenge_id and st.user_id = cp.user_id) asc nulls last,
        cp.user_id) as rank
    from public.challenge_participants cp where cp.challenge_id = target_challenge_id
  ) update public.challenge_participants cp set position = stats.rank from stats where cp.challenge_id = target_challenge_id and cp.user_id = stats.user_id;
  select user_id into winning_user from public.challenge_participants where challenge_id = target_challenge_id order by position limit 1;
  select user_id into losing_user from public.challenge_participants where challenge_id = target_challenge_id order by position desc limit 1;
  update public.challenges set status = 'COMPLETED', winner_id = winning_user, updated_at = now(), version = version + 1 where id = target_challenge_id returning circle_id into target_circle;
  update public.penalties set assigned_to = losing_user, status = 'ASSIGNED' where challenge_id = target_challenge_id;
  update public.rewards set assigned_to = winning_user, status = 'ASSIGNED' where challenge_id = target_challenge_id;
  insert into public.activities(circle_id, challenge_id, actor_id, type, payload) values (target_circle, target_challenge_id, winning_user, 'CHALLENGE_COMPLETED', jsonb_build_object('winnerId', winning_user));
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload) values ('challenge', target_challenge_id, 'ChallengeCompleted', jsonb_build_object('winnerId', winning_user, 'loserId', losing_user));
  return winning_user;
end;
$$;

revoke all on function public.accept_circle_invite(text) from public;
revoke all on function public.create_challenge(jsonb) from public;
revoke all on function public.generate_challenge_occurrences(uuid) from public;
revoke all on function public.respond_to_challenge(uuid, public.acceptance_status) from public;
revoke all on function public.submit_check_in(uuid, text, numeric, jsonb) from public;
revoke all on function public.review_check_in(uuid, public.validation_decision, text) from public;
revoke all on function public.complete_challenge(uuid) from public;
grant execute on function public.accept_circle_invite(text) to authenticated;
grant execute on function public.create_challenge(jsonb) to authenticated;
grant execute on function public.respond_to_challenge(uuid, public.acceptance_status) to authenticated;
grant execute on function public.submit_check_in(uuid, text, numeric, jsonb) to authenticated;
grant execute on function public.review_check_in(uuid, public.validation_decision, text) to authenticated;
grant execute on function public.complete_challenge(uuid) to service_role;

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_invites enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.goals enable row level security;
alter table public.goal_occurrences enable row level security;
alter table public.check_ins enable row level security;
alter table public.evidence enable row level security;
alter table public.validations enable row level security;
alter table public.score_transactions enable row level security;
alter table public.penalties enable row level security;
alter table public.rewards enable row level security;
alter table public.notifications enable row level security;
alter table public.devices enable row level security;
alter table public.activities enable row level security;
alter table public.reactions enable row level security;
alter table public.outbox_events enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.audit_log enable row level security;
alter table public.reports enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_circle_read on public.profiles for select using (exists(select 1 from public.circle_members mine join public.circle_members theirs on mine.circle_id = theirs.circle_id where mine.user_id = auth.uid() and theirs.user_id = profiles.id));
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy friendships_participant_all on public.friendships for all using (auth.uid() in (requester_id, addressee_id)) with check (auth.uid() in (requester_id, addressee_id));
create policy circles_member_read on public.circles for select using (public.is_circle_member(id));
create policy circles_create on public.circles for insert with check (owner_id = auth.uid());
create policy circles_owner_update on public.circles for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy circle_members_member_read on public.circle_members for select using (public.is_circle_member(circle_id));
create policy circle_members_self_delete on public.circle_members for delete using (user_id = auth.uid());
create policy invites_member_read on public.circle_invites for select using (public.is_circle_member(circle_id));
create policy invites_admin_create on public.circle_invites for insert with check (created_by = auth.uid() and exists(select 1 from public.circle_members where circle_id = circle_invites.circle_id and user_id = auth.uid() and role in ('OWNER', 'ADMIN')));

create policy challenges_participant_read on public.challenges for select using (public.is_challenge_participant(id));
create policy challenges_circle_draft_read on public.challenges for select using (status = 'DRAFT' and creator_id = auth.uid());
create policy challenges_create on public.challenges for insert with check (creator_id = auth.uid() and public.is_circle_member(circle_id));
create policy challenges_creator_draft_update on public.challenges for update using (creator_id = auth.uid() and status = 'DRAFT') with check (creator_id = auth.uid());
create policy participants_challenge_read on public.challenge_participants for select using (public.is_challenge_participant(challenge_id));
create policy participants_creator_insert on public.challenge_participants for insert with check (exists(select 1 from public.challenges where id = challenge_id and creator_id = auth.uid() and status = 'DRAFT'));
create policy participants_self_accept on public.challenge_participants for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_participant_read on public.goals for select using (public.is_challenge_participant(challenge_id));
create policy goals_creator_write on public.goals for all using (exists(select 1 from public.challenges where id = challenge_id and creator_id = auth.uid() and status = 'DRAFT')) with check (exists(select 1 from public.challenges where id = challenge_id and creator_id = auth.uid() and status = 'DRAFT'));
create policy occurrences_participant_read on public.goal_occurrences for select using (public.is_challenge_participant(challenge_id));
create policy check_ins_participant_read on public.check_ins for select using (public.is_challenge_participant(challenge_id));
create policy evidence_authorized_read on public.evidence for select using (owner_id = auth.uid() or exists(select 1 from public.check_ins c where c.id = check_in_id and public.is_challenge_participant(c.challenge_id)));
create policy evidence_owner_create on public.evidence for insert with check (owner_id = auth.uid() and storage_path like auth.uid()::text || '/%');
create policy validations_participant_read on public.validations for select using (exists(select 1 from public.check_ins c where c.id = check_in_id and public.is_challenge_participant(c.challenge_id)));
create policy scores_participant_read on public.score_transactions for select using (public.is_challenge_participant(challenge_id));
create policy penalties_participant_read on public.penalties for select using (public.is_challenge_participant(challenge_id));
create policy rewards_participant_read on public.rewards for select using (public.is_challenge_participant(challenge_id));
create policy notifications_self_all on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy devices_self_all on public.devices for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy activities_member_read on public.activities for select using (public.is_circle_member(circle_id));
create policy reactions_member_read on public.reactions for select using (exists(select 1 from public.activities a where a.id = activity_id and public.is_circle_member(a.circle_id)));
create policy reactions_self_write on public.reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy idempotency_self_read on public.idempotency_keys for select using (user_id = auth.uid());
create policy reports_self_create on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_self_read on public.reports for select using (reporter_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy evidence_storage_read on storage.objects for select to authenticated
using (bucket_id = 'evidence' and exists(select 1 from public.evidence e left join public.check_ins c on c.id = e.check_in_id where e.storage_path = name and (e.owner_id = auth.uid() or public.is_challenge_participant(c.challenge_id))));
create policy evidence_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'evidence' and owner_id = auth.uid()::text);

alter publication supabase_realtime add table public.challenge_participants;
alter publication supabase_realtime add table public.validations;
alter publication supabase_realtime add table public.activities;
