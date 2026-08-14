-- El feed de actividad (public.activities) existe desde el esquema inicial
-- con RLS y grants completos, pero nunca se generaba una entrada al validar
-- un check-in — el evento más frecuente y más "reaccionable" del círculo.
-- Misma función que la anterior (202608140023), añadiendo solo el insert
-- en activities junto al resto de efectos ya existentes al aprobar.
create or replace function public.review_check_in(target_check_in_id uuid, review_decision public.validation_decision, review_reason text default null)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare checked public.check_ins; occurrence public.goal_occurrences; goal public.goals; updated public.check_ins; challenge public.challenges;
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
      update public.profiles set total_points = total_points + goal.base_points, current_streak = current_streak + 1, best_streak = greatest(best_streak, current_streak + 1) where id = checked.user_id;
      select * into challenge from public.challenges where id = checked.challenge_id;
      insert into public.activities(circle_id, challenge_id, actor_id, type, payload)
      values (challenge.circle_id, challenge.id, checked.user_id, 'CHECK_IN_APPROVED',
        jsonb_build_object('goalName', goal.name, 'challengeTitle', challenge.title, 'points', goal.base_points));
    end if;
  end if;
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', checked.id, case when review_decision = 'APPROVED' then 'CheckInApproved' else 'CheckInRejected' end, jsonb_build_object('checkInId', checked.id));
  return updated;
end;
$$;
