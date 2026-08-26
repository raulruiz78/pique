-- Datos de prueba adicionales, SOLO para desarrollo local manual.
-- No forma parte de supabase/seed.sql (ese lo usa también CI/e2e) y no
-- sobrevive a `pnpm db:reset` — vuelve a ejecutar este script después de
-- cada reset con:
--   docker exec -i supabase_db_pique-local psql -U postgres -d postgres < scripts/dev-seed-extra.sql
-- Requiere que supabase/seed.sql ya se haya aplicado (usuarios raul/carmen
-- y el círculo "Los del pique" existentes).

do $$
declare
  raul uuid := '10000000-0000-0000-0000-000000000001';
  carmen uuid := '10000000-0000-0000-0000-000000000002';
  circle1 uuid := '20000000-0000-0000-0000-000000000001';
  circle2 uuid := '20000000-0000-0000-0000-000000000002';
  challenge_a uuid := '30000000-0000-0000-0000-000000000002';
  challenge_b uuid := '30000000-0000-0000-0000-000000000003';
  challenge_c uuid := '30000000-0000-0000-0000-000000000004';
  carmen_occ_a uuid;
begin
  -- Segundo círculo: para ver el nuevo selector de tarjetas con más de
  -- una opción al crear un reto.
  insert into public.circles(id, owner_id, name, description)
  values (circle2, raul, 'Cocina y series', 'El círculo de las cosas menos serias.')
  on conflict (id) do nothing;
  insert into public.circle_members(circle_id, user_id, role)
  values (circle2, carmen, 'MEMBER') on conflict do nothing;

  -- A) Fijo diario, CON multiplicador, racha alta (~x1.40) para Raúl.
  insert into public.challenges(id, circle_id, creator_id, title, description, rules, type, status, start_at, end_at, timezone, recurrence, validation_type, evidence_required, category)
  values (challenge_a, circle1, raul, 'Multiplicador al rojo', 'Cada día de racha sube los puntos.', 'El rival valida.', 'FREQUENCY', 'ACTIVE', now() - interval '8 days', now() + interval '20 days', 'Europe/Madrid', 'FREQ=DAILY', 'PEER_REVIEW', false, 'TRAINING')
  on conflict (id) do nothing;
  insert into public.challenge_participants(challenge_id, user_id, acceptance, accepted_at, score, streak_days)
  values (challenge_a, raul, 'ACCEPTED', now(), 160, 8), (challenge_a, carmen, 'ACCEPTED', now(), 0, 0)
  on conflict do nothing;
  insert into public.goals(id, challenge_id, name, recurrence, base_points, evidence_required, streak_multiplier_enabled)
  values ('40000000-0000-0000-0000-000000000002', challenge_a, 'Estirar 10 minutos', 'FREQ=DAILY', 20, false, true)
  on conflict (id) do nothing;
  perform public.generate_challenge_occurrences(challenge_a);

  -- B) Varias veces al día (3x), CON multiplicador, racha baja (~x1.10).
  insert into public.challenges(id, circle_id, creator_id, title, description, rules, type, status, start_at, end_at, timezone, recurrence, validation_type, evidence_required, category)
  values (challenge_b, circle1, raul, 'Flexiones x3', 'Tres tandas repartidas en el día.', 'Vale cualquier hora.', 'FREQUENCY', 'ACTIVE', now() - interval '2 days', now() + interval '20 days', 'Europe/Madrid', 'FREQ=DAILY;DAILYCOUNT=3', 'PEER_REVIEW', false, 'TRAINING')
  on conflict (id) do nothing;
  insert into public.challenge_participants(challenge_id, user_id, acceptance, accepted_at, score, streak_days)
  values (challenge_b, raul, 'ACCEPTED', now(), 20, 2), (challenge_b, carmen, 'ACCEPTED', now(), 0, 0)
  on conflict do nothing;
  insert into public.goals(id, challenge_id, name, recurrence, base_points, evidence_required, streak_multiplier_enabled)
  values ('40000000-0000-0000-0000-000000000003', challenge_b, 'Flexiones', 'FREQ=DAILY;DAILYCOUNT=3', 10, false, true)
  on conflict (id) do nothing;
  perform public.generate_challenge_occurrences(challenge_b);

  -- C) Flexible (3 veces/semana), CON multiplicador, racha en 0 (x1.00 —
  -- para comprobar que se muestra el valor aunque no haya subido nunca).
  insert into public.challenges(id, circle_id, creator_id, title, description, rules, type, status, start_at, end_at, timezone, recurrence, validation_type, evidence_required, category)
  values (challenge_c, circle1, carmen, 'Lectura semanal', 'Tres ratos de lectura, cuando queráis.', 'Foto de la página por la que vais.', 'FREQUENCY', 'ACTIVE', now() - interval '1 day', now() + interval '30 days', 'Europe/Madrid', 'FREQ=WEEKLY;FLEX=3', 'PEER_REVIEW', false, 'FOCUS')
  on conflict (id) do nothing;
  insert into public.challenge_participants(challenge_id, user_id, acceptance, accepted_at, score, streak_days)
  values (challenge_c, raul, 'ACCEPTED', now(), 0, 0), (challenge_c, carmen, 'ACCEPTED', now(), 0, 0)
  on conflict do nothing;
  insert into public.goals(id, challenge_id, name, recurrence, base_points, evidence_required, streak_multiplier_enabled)
  values ('40000000-0000-0000-0000-000000000004', challenge_c, 'Leer', 'FREQ=WEEKLY;FLEX=3', 5, false, true)
  on conflict (id) do nothing;
  perform public.generate_challenge_occurrences(challenge_c);

  -- Un check-in de Carmen esperando validación de Raúl (pestaña "Validar"
  -- del bottom nav con contenido nada más entrar).
  select id into carmen_occ_a from public.goal_occurrences
    where challenge_id = challenge_a and participant_id = carmen
      and now() between starts_at and closes_at
    order by starts_at limit 1;
  if carmen_occ_a is not null then
    insert into public.check_ins(occurrence_id, challenge_id, user_id, note, status)
    values (carmen_occ_a, challenge_a, carmen, 'Hecho, un poco tarde pero hecho.', 'PENDING_REVIEW')
    on conflict do nothing;
    update public.goal_occurrences set status = 'SUBMITTED' where id = carmen_occ_a;
  end if;

  raise notice 'Listo: círculo 2 (%), retos A/B/C (%/%/%)  ', circle2, challenge_a, challenge_b, challenge_c;
end $$;
