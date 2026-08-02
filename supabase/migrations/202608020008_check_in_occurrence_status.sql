-- Keep enum types explicit inside CASE expressions on PostgreSQL 17.
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
  values (
    occurrence.id,
    occurrence.challenge_id,
    auth.uid(),
    check_note,
    check_value,
    case
      when challenge.validation_type = 'SELF' then 'APPROVED'::public.check_in_status
      else 'PENDING_REVIEW'::public.check_in_status
    end
  ) returning * into created;
  if evidence_payload is not null then
    if evidence_payload ->> 'storagePath' not like auth.uid()::text || '/%' then raise exception 'INVALID_EVIDENCE_PATH'; end if;
    insert into public.evidence(check_in_id, owner_id, type, storage_path, mime_type, size_bytes, sha256)
    values (created.id, auth.uid(), 'PHOTO', evidence_payload ->> 'storagePath', evidence_payload ->> 'mimeType', (evidence_payload ->> 'sizeBytes')::bigint, evidence_payload ->> 'sha256');
  end if;
  update public.goal_occurrences
  set status = case
    when challenge.validation_type = 'SELF' then 'APPROVED'::public.occurrence_status
    else 'SUBMITTED'::public.occurrence_status
  end
  where id = occurrence.id;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', created.id, case when challenge.validation_type = 'SELF' then 'CheckInApproved' else 'CheckInSubmitted' end, jsonb_build_object('checkInId', created.id));
  return created;
end;
$$;

revoke all on function public.submit_check_in(uuid, text, numeric, jsonb) from public;
grant execute on function public.submit_check_in(uuid, text, numeric, jsonb) to authenticated;
