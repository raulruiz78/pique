-- A flexible weekly goal exposes N independent check-in slots for the whole
-- week instead of tying each slot to a particular weekday.
-- This also fixes enum inference in the participant acceptance expression.
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
    values (
      created_id,
      participant::uuid,
      case when participant::uuid = auth.uid() then 'ACCEPTED'::public.acceptance_status else 'PENDING'::public.acceptance_status end,
      case when participant::uuid = auth.uid() then now() else null end
    );
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
declare
  challenge public.challenges;
  goal public.goals;
  participant record;
  day timestamptz;
  week_start timestamptz;
  slot integer;
  flexible_target integer;
  inserted_count integer := 0;
  code text;
begin
  select * into challenge from public.challenges where id = target_challenge_id;
  select * into goal from public.goals where challenge_id = target_challenge_id order by created_at limit 1;
  flexible_target := nullif(substring(goal.recurrence from 'FLEX=([0-9]+)'), '')::integer;

  for participant in
    select user_id from public.challenge_participants
    where challenge_id = target_challenge_id and acceptance = 'ACCEPTED'
  loop
    if flexible_target is not null then
      flexible_target := greatest(1, least(flexible_target, 7));
      for week_start in
        select generate_series(
          date_trunc('week', challenge.start_at),
          least(date_trunc('week', challenge.end_at), date_trunc('week', challenge.start_at) + interval '28 days'),
          interval '7 days'
        )
      loop
        for slot in 1..flexible_target loop
          insert into public.goal_occurrences(goal_id, challenge_id, participant_id, starts_at, closes_at)
          values (
            goal.id,
            challenge.id,
            participant.user_id,
            greatest(week_start, challenge.start_at) + ((slot - 1) * interval '1 millisecond'),
            least(week_start + interval '7 days' - interval '1 second', challenge.end_at)
          ) on conflict do nothing;
          if found then inserted_count := inserted_count + 1; end if;
        end loop;
      end loop;
    else
      for day in
        select generate_series(
          date_trunc('day', challenge.start_at),
          least(date_trunc('day', challenge.end_at), date_trunc('day', challenge.start_at) + interval '29 days'),
          interval '1 day'
        )
      loop
        code := (array['SU','MO','TU','WE','TH','FR','SA'])[extract(dow from day)::integer + 1];
        if goal.recurrence like 'FREQ=DAILY%' or goal.recurrence like '%BYDAY=%' || code || '%' then
          insert into public.goal_occurrences(goal_id, challenge_id, participant_id, starts_at, closes_at)
          values (goal.id, challenge.id, participant.user_id, day, day + interval '1 day' - interval '1 second')
          on conflict do nothing;
          if found then inserted_count := inserted_count + 1; end if;
        end if;
      end loop;
    end if;
  end loop;
  return inserted_count;
end;
$$;

revoke all on function public.generate_challenge_occurrences(uuid) from public;
