-- Antes, una vez una ocurrencia pasaba a REJECTED no había forma de volver
-- a intentarlo: submit_check_in exigía status = 'PENDING' y el usuario se
-- quedaba bloqueado sin poder subir nada más, sin saber por qué se rechazó
-- ni poder responder. Ahora se permite reenviar mientras la ocurrencia siga
-- REJECTED (y dentro de la misma ventana horaria de siempre): se actualiza
-- el check_in existente (occurrence_id es único, no se puede insertar otro)
-- en vez de crear uno nuevo, y se sustituye la evidencia si la hay. El
-- historial de validations (incluida la razón del rechazo) no se toca —
-- queda como rastro de qué se dijo la vez anterior.
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
          reviewed_at = null, updated_at = now(), version = version + 1
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
  update public.goal_occurrences set status = case when challenge.validation_type = 'SELF' then 'APPROVED' else 'SUBMITTED' end where id = occurrence.id;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', created.id, case when challenge.validation_type = 'SELF' then 'CheckInApproved' else 'CheckInSubmitted' end, jsonb_build_object('checkInId', created.id));
  return created;
end;
$$;
