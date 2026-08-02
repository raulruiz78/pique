-- Support goals that must be completed N independent times every day.
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
  daily_target integer;
  inserted_count integer := 0;
  code text;
begin
  select * into challenge from public.challenges where id = target_challenge_id;
  select * into goal from public.goals where challenge_id = target_challenge_id order by created_at limit 1;
  flexible_target := nullif(substring(goal.recurrence from 'FLEX=([0-9]+)'), '')::integer;
  daily_target := nullif(substring(goal.recurrence from 'DAILYCOUNT=([0-9]+)'), '')::integer;

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
    elsif daily_target is not null then
      daily_target := greatest(2, least(daily_target, 10));
      for day in
        select generate_series(
          date_trunc('day', challenge.start_at),
          least(date_trunc('day', challenge.end_at), date_trunc('day', challenge.start_at) + interval '29 days'),
          interval '1 day'
        )
      loop
        for slot in 1..daily_target loop
          insert into public.goal_occurrences(goal_id, challenge_id, participant_id, starts_at, closes_at)
          values (
            goal.id,
            challenge.id,
            participant.user_id,
            greatest(day, challenge.start_at) + ((slot - 1) * interval '1 millisecond'),
            least(day + interval '1 day' - interval '1 second', challenge.end_at)
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
