-- Puntos fijos por check-in (5/10/20), no un rango libre: el ranking
-- global y las medallas por puntos (cada 500) asumen incrementos
-- predecibles. La UI ya restringe a estos tres valores, pero
-- create_challenge es una función `security definer` invocable
-- directamente por cualquier cliente autenticado — la validación tiene
-- que vivir aquí también, no solo en el esquema Zod de la API route.
create or replace function public.create_challenge(payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare created_id uuid := gen_random_uuid(); participant text; circle uuid := (payload ->> 'circleId')::uuid;
begin
  if not public.is_circle_member(circle, auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  if jsonb_array_length(payload -> 'participantIds') < 2 then raise exception 'PARTICIPANTS_REQUIRED'; end if;
  if (payload ->> 'points')::integer not in (5, 10, 20) then raise exception 'INVALID_POINTS'; end if;
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

-- Recordatorio de tarde: "aún te queda X por cumplir hoy", con tono de
-- racha en juego si aplica. El plan de Vercel de este proyecto es Hobby,
-- que solo permite un cron diario — por eso esto no es una ventana
-- horaria evaluada en SQL (como notify_streak_at_risk/
-- notify_occurrence_pending, ambas con "closes_at entre ahora y ahora+Nh",
-- pensadas para un cron frecuente que hoy no se puede tener) sino un
-- chequeo de "¿sigue pendiente ahora mismo?" pensado para ejecutarse una
-- única vez al día, a la hora que fije apps/web/vercel.json.
create or replace function public.notify_afternoon_reminder()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED'; end if;

  with candidates as (
    select o.id as occurrence_id, o.participant_id, o.challenge_id, c.title, cp.current_streak
    from public.goal_occurrences o
    join public.challenge_participants cp
      on cp.challenge_id = o.challenge_id and cp.user_id = o.participant_id
    join public.challenges c on c.id = o.challenge_id
    where o.status = 'PENDING'
      and now() between o.starts_at and o.closes_at
      and not exists (
        select 1 from public.notifications n
        where n.user_id = o.participant_id
          and n.type = 'AFTERNOON_REMINDER'
          and n.href = '/retos/' || o.challenge_id::text || '?occurrence=' || o.id::text
      )
  )
  insert into public.notifications(user_id, type, title, body, href)
  select participant_id, 'AFTERNOON_REMINDER',
    case when current_streak > 0 then '🔥 Se te acaba la racha' else '⏰ Aún te queda algo hoy' end,
    case when current_streak > 0
      then 'No has cumplido «' || title || '» — se acaba tu racha de ' || current_streak || ' días.'
      else 'Todavía puedes cumplir «' || title || '» hoy.' end,
    '/retos/' || challenge_id::text || '?occurrence=' || occurrence_id::text
  from candidates;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.notify_afternoon_reminder() from public;
grant execute on function public.notify_afternoon_reminder() to service_role;
