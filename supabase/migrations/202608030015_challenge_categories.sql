alter table public.challenges add column if not exists category text not null default 'OTHER'
  check (category in ('TRAINING','HEALTH','HOME','FOCUS','SOCIAL','CREATIVE','OUTDOORS','OTHER'));

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
  insert into public.goals(challenge_id,name,metric,target,unit,recurrence,base_points,evidence_required,evidence_type) values(created_id,coalesce(payload->>'goalName',payload->>'title'),coalesce(payload->>'metric','BOOLEAN'),coalesce((payload->>'target')::numeric,1),coalesce(payload->>'unit','vez'),payload->>'recurrence',(payload->>'points')::integer,(payload->>'evidenceRequired')::boolean,case when (payload->>'evidenceRequired')::boolean then 'PHOTO'::public.evidence_type else null end);
  if nullif(payload->>'consequence','') is not null then insert into public.penalties(challenge_id,description) values(created_id,payload->>'consequence'); end if;
  insert into public.activities(circle_id,challenge_id,actor_id,type,payload) values(circle,created_id,auth.uid(),'CHALLENGE_CREATED',jsonb_build_object('title',payload->>'title','category',coalesce(payload->>'category','OTHER')));
  insert into public.outbox_events(aggregate_type,aggregate_id,event_type,payload) values('challenge',created_id,'ChallengeCreated',jsonb_build_object('challengeId',created_id));
  return created_id;
end;
$$;
