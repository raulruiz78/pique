-- Multiplicador de racha (opt-in por reto): los puntos de cada check-in
-- aprobado se multiplican hasta x2 según la racha del participante en ese
-- reto. La racha se normaliza por unidad de cadencia completa (un día para
-- retos fijos o de varias veces al día, una semana para los flexibles) en
-- vez de por ocurrencia individual — si no, un reto de 3 veces/día llegaría
-- al tope x2 tres veces más rápido que uno diario con el mismo esfuerzo.
--
-- De paso, esta migración cierra dos huecos descubiertos al diseñar esto:
-- 1. Los retos de autovalidación (validation_type = 'SELF') nunca puntuaban
--    ni sumaban racha: submit_check_in marca el check-in como APPROVED de
--    inmediato, pero solo review_check_in otorgaba puntos, y esa función
--    exige que el check-in esté en PENDING_REVIEW — estado por el que un
--    check-in autovalidado nunca pasa.
-- 2. Un check-in rechazado y nunca reenviado no rompía la racha: el cron de
--    mantenimiento solo expiraba ocurrencias en estado PENDING, dejando
--    fuera las REJECTED abandonadas — un colador para conservar racha sin
--    currárselo, inconsistente con "si fallas, la racha se pierde entera".
--
-- La lógica de puntuación/racha compartida por review_check_in,
-- submit_check_in (autovalidación) y el nuevo auto-aprobado por SLA vive en
-- _apply_check_in_approval para no triplicarla.

alter table public.goals
  add column streak_multiplier_enabled boolean not null default false;

alter table public.challenge_participants
  add column streak_days integer not null default 0;

create or replace function public._apply_check_in_approval(target_check_in_id uuid, is_auto boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  checked public.check_ins;
  occurrence public.goal_occurrences;
  goal public.goals;
  challenge public.challenges;
  bucket_start timestamptz;
  bucket_end timestamptz;
  total_siblings integer;
  approved_siblings integer;
  next_streak_days integer;
  multiplier numeric;
  awarded_points integer;
  inserted_id uuid;
begin
  select * into checked from public.check_ins where id = target_check_in_id;
  select * into occurrence from public.goal_occurrences where id = checked.occurrence_id;
  select * into goal from public.goals where id = occurrence.goal_id;
  select * into challenge from public.challenges where id = checked.challenge_id;

  if goal.recurrence like '%FLEX=%' then
    bucket_start := date_trunc('week', occurrence.starts_at);
    bucket_end := bucket_start + interval '7 days';
  else
    bucket_start := date_trunc('day', occurrence.starts_at);
    bucket_end := bucket_start + interval '1 day';
  end if;
  select count(*), count(*) filter (where status = 'APPROVED')
    into total_siblings, approved_siblings
    from public.goal_occurrences
    where goal_id = occurrence.goal_id and participant_id = occurrence.participant_id
      and starts_at >= bucket_start and starts_at < bucket_end;

  select cp.streak_days into next_streak_days from public.challenge_participants cp
    where cp.challenge_id = checked.challenge_id and cp.user_id = checked.user_id for update;
  if approved_siblings = total_siblings then
    next_streak_days := coalesce(next_streak_days, 0) + 1;
  end if;

  multiplier := case when goal.streak_multiplier_enabled
    then least(2, 1 + 0.05 * coalesce(next_streak_days, 0))
    else 1 end;
  awarded_points := floor(goal.base_points * multiplier);

  insert into public.score_transactions(challenge_id, user_id, points, source_type, source_id, reason)
  values (checked.challenge_id, checked.user_id, awarded_points, 'CHECK_IN', checked.id, 'APPROVED')
  on conflict do nothing returning id into inserted_id;
  if inserted_id is null then return; end if;

  update public.challenge_participants
    set score = score + awarded_points, streak_days = next_streak_days
    where challenge_id = checked.challenge_id and user_id = checked.user_id;
  update public.profiles
    set total_points = total_points + awarded_points, current_streak = current_streak + 1, best_streak = greatest(best_streak, current_streak + 1)
    where id = checked.user_id;

  insert into public.activities(circle_id, challenge_id, actor_id, type, payload)
  values (challenge.circle_id, challenge.id, checked.user_id, 'CHECK_IN_APPROVED',
    jsonb_build_object('goalName', goal.name, 'challengeTitle', challenge.title, 'points', awarded_points, 'autoApproved', is_auto));
end;
$$;
revoke all on function public._apply_check_in_approval(uuid, boolean) from public;

create or replace function public.review_check_in(target_check_in_id uuid, review_decision public.validation_decision, review_reason text default null)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare checked public.check_ins; updated public.check_ins;
begin
  select * into checked from public.check_ins where id = target_check_in_id for update;
  if not found or not public.is_challenge_participant(checked.challenge_id, auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  if checked.user_id = auth.uid() then raise exception 'SELF_REVIEW_NOT_ALLOWED'; end if;
  if checked.status <> 'PENDING_REVIEW' then raise exception 'ALREADY_REVIEWED'; end if;
  insert into public.validations(check_in_id, reviewer_id, decision, reason) values (checked.id, auth.uid(), review_decision, review_reason);
  update public.check_ins set status = review_decision::text::public.check_in_status, reviewed_at = now(), updated_at = now(), version = version + 1 where id = checked.id returning * into updated;
  update public.goal_occurrences set status = review_decision::text::public.occurrence_status where id = checked.occurrence_id;
  if review_decision = 'APPROVED' then
    perform public._apply_check_in_approval(checked.id);
  end if;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', checked.id, case when review_decision = 'APPROVED' then 'CheckInApproved' else 'CheckInRejected' end, jsonb_build_object('checkInId', checked.id));
  return updated;
end;
$$;

create or replace function public.submit_check_in(target_occurrence_id uuid, check_note text default null, check_value numeric default null, evidence_payload jsonb default null)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare
  occurrence public.goal_occurrences;
  challenge public.challenges;
  goal public.goals;
  created public.check_ins;
  existing_check_in public.check_ins;
  new_status public.check_in_status;
begin
  select * into occurrence from public.goal_occurrences where id = target_occurrence_id for update;
  if not found or occurrence.participant_id <> auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  if occurrence.status not in ('PENDING', 'REJECTED') then raise exception 'OCCURRENCE_ALREADY_USED'; end if;
  if now() < occurrence.starts_at or now() > occurrence.closes_at then raise exception 'OUTSIDE_CHECK_IN_WINDOW'; end if;
  select * into challenge from public.challenges where id = occurrence.challenge_id;
  select * into goal from public.goals where id = occurrence.goal_id;
  if challenge.status <> 'ACTIVE' then raise exception 'CHALLENGE_NOT_ACTIVE'; end if;
  if goal.evidence_required and evidence_payload is null then raise exception 'EVIDENCE_REQUIRED'; end if;
  new_status := case when challenge.validation_type = 'SELF' then 'APPROVED'::public.check_in_status else 'PENDING_REVIEW'::public.check_in_status end;
  if occurrence.status = 'REJECTED' then
    select * into existing_check_in from public.check_ins where occurrence_id = occurrence.id for update;
    if not found or existing_check_in.user_id <> auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
    update public.check_ins
      set note = check_note, value = check_value, status = new_status,
          submitted_at = now(), reviewed_at = null, updated_at = now(), version = version + 1
      where id = existing_check_in.id
      returning * into created;
  else
    insert into public.check_ins(occurrence_id, challenge_id, user_id, note, value, status)
    values (occurrence.id, occurrence.challenge_id, auth.uid(), check_note, check_value, new_status)
    returning * into created;
  end if;
  if evidence_payload is not null then
    if evidence_payload ->> 'storagePath' not like auth.uid()::text || '/%' then raise exception 'INVALID_EVIDENCE_PATH'; end if;
    insert into public.evidence(check_in_id, owner_id, type, storage_path, mime_type, size_bytes, sha256)
    values (created.id, auth.uid(), 'PHOTO', evidence_payload ->> 'storagePath', evidence_payload ->> 'mimeType', (evidence_payload ->> 'sizeBytes')::bigint, evidence_payload ->> 'sha256')
    on conflict (check_in_id) do update set
      storage_path = excluded.storage_path,
      mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes,
      sha256 = excluded.sha256,
      created_at = now();
  end if;
  update public.goal_occurrences set status = (case when challenge.validation_type = 'SELF' then 'APPROVED' else 'SUBMITTED' end)::public.occurrence_status where id = occurrence.id;
  if challenge.validation_type = 'SELF' then
    perform public._apply_check_in_approval(created.id);
  end if;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', created.id, case when challenge.validation_type = 'SELF' then 'CheckInApproved' else 'CheckInSubmitted' end, jsonb_build_object('checkInId', created.id));
  return created;
end;
$$;

create or replace function public.auto_approve_stale_check_ins() returns integer
language plpgsql security definer set search_path = '' as $$
declare stale record; approved_count integer := 0;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;
  for stale in
    select id, occurrence_id from public.check_ins
    where status = 'PENDING_REVIEW' and submitted_at < now() - interval '1 day'
    for update skip locked
  loop
    update public.check_ins set status = 'APPROVED', reviewed_at = now(), updated_at = now(), version = version + 1 where id = stale.id;
    update public.goal_occurrences set status = 'APPROVED' where id = stale.occurrence_id;
    perform public._apply_check_in_approval(stale.id, true);
    insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
    values ('check_in', stale.id, 'CheckInApproved', jsonb_build_object('checkInId', stale.id, 'autoApproved', true));
    approved_count := approved_count + 1;
  end loop;
  return approved_count;
end;
$$;
revoke all on function public.auto_approve_stale_check_ins() from public;
grant execute on function public.auto_approve_stale_check_ins() to service_role;

create or replace function public.create_challenge(payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare created_id uuid := gen_random_uuid(); participant text; circle uuid := (payload ->> 'circleId')::uuid;
begin
  if not public.is_circle_member(circle, auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  if jsonb_array_length(payload -> 'participantIds') < 2 then raise exception 'PARTICIPANTS_REQUIRED'; end if;
  for participant in select jsonb_array_elements_text(payload -> 'participantIds') loop
    if not public.is_circle_member(circle, participant::uuid) then raise exception 'PARTICIPANT_NOT_IN_CIRCLE'; end if;
  end loop;
  insert into public.challenges(id,circle_id,creator_id,title,description,rules,type,status,start_at,end_at,timezone,recurrence,validation_type,evidence_required,category)
  values(created_id,circle,auth.uid(),payload->>'title',coalesce(payload->>'description',''),coalesce(payload->>'rules',''),(payload->>'type')::public.challenge_type,'PENDING_ACCEPTANCE',(payload->>'startAt')::timestamptz,(payload->>'endAt')::timestamptz,payload->>'timezone',payload->>'recurrence',(payload->>'validationType')::public.validation_type,(payload->>'evidenceRequired')::boolean,coalesce(payload->>'category','OTHER'));
  for participant in select jsonb_array_elements_text(payload -> 'participantIds') loop
    insert into public.challenge_participants(challenge_id,user_id,acceptance,accepted_at) values(created_id,participant::uuid,case when participant::uuid=auth.uid() then 'ACCEPTED'::public.acceptance_status else 'PENDING'::public.acceptance_status end,case when participant::uuid=auth.uid() then now() else null end);
  end loop;
  insert into public.goals(challenge_id,name,metric,target,unit,recurrence,base_points,evidence_required,evidence_type,streak_multiplier_enabled) values(created_id,coalesce(payload->>'goalName',payload->>'title'),coalesce(payload->>'metric','BOOLEAN'),coalesce((payload->>'target')::numeric,1),coalesce(payload->>'unit','vez'),payload->>'recurrence',(payload->>'points')::integer,(payload->>'evidenceRequired')::boolean,case when (payload->>'evidenceRequired')::boolean then 'PHOTO'::public.evidence_type else null end,coalesce((payload->>'streakMultiplier')::boolean,false));
  if nullif(payload->>'consequence','') is not null then insert into public.penalties(challenge_id,description) values(created_id,payload->>'consequence'); end if;
  insert into public.activities(circle_id,challenge_id,actor_id,type,payload) values(circle,created_id,auth.uid(),'CHALLENGE_CREATED',jsonb_build_object('title',payload->>'title','category',coalesce(payload->>'category','OTHER')));
  insert into public.outbox_events(aggregate_type,aggregate_id,event_type,payload) values('challenge',created_id,'ChallengeCreated',jsonb_build_object('challengeId',created_id));
  return created_id;
end;
$$;
