-- Monedas y comodines por círculo: cada punto que ganas en un reto suma 1
-- "coin" a un saldo aparte, específico del círculo (nunca resta de tu
-- puntuación de ranking — son cosas independientes desde el modelo de
-- datos, no solo en la UI). Con 1000 coins se compra un comodín; un
-- comodín salta un check-in con auto-aprobado, sin evidencia, sin dar
-- puntos ni coins nuevos (si diera puntos, el sistema se alimentaría solo).

alter table public.circle_members
  add column coin_balance integer not null default 0,
  add column shield_count integer not null default 0;

alter table public.check_ins
  add column via_shield boolean not null default false;

create table public.circle_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  source_type text not null,
  source_id uuid,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id, reason)
);
alter table public.circle_coin_transactions enable row level security;
create policy circle_coin_transactions_self_read on public.circle_coin_transactions
  for select using (user_id = auth.uid());
grant select on public.circle_coin_transactions to authenticated;

-- ============================================================
-- _apply_check_in_approval: añade el abono de coins (solo si se otorgan
-- puntos) y el nuevo caso is_shield, que corre la misma continuidad de
-- racha (bucket de streak_days, current_streak/best_streak) pero sin
-- tocar puntuación, score_transactions ni coins.
--
-- create or replace no sustituye una función si cambian los tipos de
-- parámetros (queda como sobrecarga nueva, ambigua en llamadas con menos
-- argumentos) — hay que tirar la firma anterior de dos parámetros a
-- propósito antes de crear la de tres.
-- ============================================================
drop function if exists public._apply_check_in_approval(uuid, boolean);
create or replace function public._apply_check_in_approval(target_check_in_id uuid, is_auto boolean default false, is_shield boolean default false)
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

  if is_shield then
    -- Un comodín salva la racha pero no otorga nada: ni puntos, ni coins.
    update public.challenge_participants
      set streak_days = next_streak_days
      where challenge_id = checked.challenge_id and user_id = checked.user_id;
    update public.profiles
      set current_streak = current_streak + 1, best_streak = greatest(best_streak, current_streak + 1)
      where id = checked.user_id;
    insert into public.activities(circle_id, challenge_id, actor_id, type, payload)
    values (challenge.circle_id, challenge.id, checked.user_id, 'CHECK_IN_SHIELDED',
      jsonb_build_object('goalName', goal.name, 'challengeTitle', challenge.title));
    return;
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

  insert into public.circle_coin_transactions(circle_id, user_id, amount, source_type, source_id, reason)
  values (challenge.circle_id, checked.user_id, awarded_points, 'CHECK_IN', checked.id, 'EARNED')
  on conflict do nothing;
  update public.circle_members set coin_balance = coin_balance + awarded_points
    where circle_id = challenge.circle_id and user_id = checked.user_id;

  insert into public.activities(circle_id, challenge_id, actor_id, type, payload)
  values (challenge.circle_id, challenge.id, checked.user_id, 'CHECK_IN_APPROVED',
    jsonb_build_object('goalName', goal.name, 'challengeTitle', challenge.title, 'points', awarded_points, 'autoApproved', is_auto));
end;
$$;

-- ============================================================
-- Comprar un comodín: 1000 coins del círculo -> +1 al inventario.
-- ============================================================
create or replace function public.purchase_circle_shield(target_circle_id uuid)
returns public.circle_members language plpgsql security definer set search_path = '' as $$
declare updated public.circle_members;
begin
  update public.circle_members
    set coin_balance = coin_balance - 1000, shield_count = shield_count + 1
    where circle_id = target_circle_id and user_id = auth.uid() and coin_balance >= 1000
    returning * into updated;
  if not found then raise exception 'INSUFFICIENT_COINS'; end if;
  insert into public.circle_coin_transactions(circle_id, user_id, amount, source_type, source_id, reason)
  values (target_circle_id, auth.uid(), -1000, 'SHIELD_PURCHASE', gen_random_uuid(), 'PURCHASED');
  return updated;
end;
$$;
revoke all on function public.purchase_circle_shield(uuid) from public;
grant execute on function public.purchase_circle_shield(uuid) to authenticated;

-- ============================================================
-- Canjear un comodín: salta el check-in de una ocurrencia propia y
-- pendiente, auto-aprobado, sin evidencia ni puntos.
-- ============================================================
create or replace function public.redeem_circle_shield(target_occurrence_id uuid)
returns public.check_ins language plpgsql security definer set search_path = '' as $$
declare
  occurrence public.goal_occurrences;
  challenge public.challenges;
  existing_check_in public.check_ins;
  created public.check_ins;
begin
  select * into occurrence from public.goal_occurrences where id = target_occurrence_id for update;
  if not found or occurrence.participant_id <> auth.uid() then raise exception 'NOT_AUTHORIZED'; end if;
  if occurrence.status not in ('PENDING', 'REJECTED') then raise exception 'OCCURRENCE_ALREADY_USED'; end if;
  if now() < occurrence.starts_at or now() > occurrence.closes_at then raise exception 'OUTSIDE_CHECK_IN_WINDOW'; end if;
  select * into challenge from public.challenges where id = occurrence.challenge_id;
  if challenge.status <> 'ACTIVE' then raise exception 'CHALLENGE_NOT_ACTIVE'; end if;

  update public.circle_members set shield_count = shield_count - 1
    where circle_id = challenge.circle_id and user_id = auth.uid() and shield_count >= 1;
  if not found then raise exception 'NO_SHIELDS_AVAILABLE'; end if;

  if occurrence.status = 'REJECTED' then
    select * into existing_check_in from public.check_ins where occurrence_id = occurrence.id for update;
    update public.check_ins
      set status = 'APPROVED', via_shield = true, note = null, value = null,
          submitted_at = now(), reviewed_at = now(), updated_at = now(), version = version + 1
      where id = existing_check_in.id
      returning * into created;
  else
    insert into public.check_ins(occurrence_id, challenge_id, user_id, status, via_shield, submitted_at, reviewed_at)
    values (occurrence.id, occurrence.challenge_id, auth.uid(), 'APPROVED', true, now(), now())
    returning * into created;
  end if;
  update public.goal_occurrences set status = 'APPROVED' where id = occurrence.id;

  insert into public.circle_coin_transactions(circle_id, user_id, amount, source_type, source_id, reason)
  values (challenge.circle_id, auth.uid(), 0, 'SHIELD_REDEEM', created.id, 'REDEEMED')
  on conflict do nothing;

  perform public._apply_check_in_approval(created.id, false, true);

  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload)
  values ('check_in', created.id, 'CheckInShielded', jsonb_build_object('checkInId', created.id));
  return created;
end;
$$;
revoke all on function public.redeem_circle_shield(uuid) from public;
grant execute on function public.redeem_circle_shield(uuid) to authenticated;
