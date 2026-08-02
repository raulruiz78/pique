-- Usuarios exclusivamente locales. Contraseña de ambos: PiqueDemo2026!
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, email_change, email_change_token_new, recovery_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'raul@pique.local', extensions.crypt('PiqueDemo2026!', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"username":"raul","display_name":"Raúl"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'carmen@pique.local', extensions.crypt('PiqueDemo2026!', extensions.gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"username":"carmen","display_name":"Carmen"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"sub":"10000000-0000-0000-0000-000000000001","email":"raul@pique.local"}', 'email', '10000000-0000-0000-0000-000000000001', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"sub":"10000000-0000-0000-0000-000000000002","email":"carmen@pique.local"}', 'email', '10000000-0000-0000-0000-000000000002', now(), now(), now())
on conflict (provider_id, provider) do nothing;

update public.profiles set onboarding_completed = true where id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002');

insert into public.circles (id, owner_id, name, description)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Los del pique', 'Raúl y Carmen convierten la constancia en un juego.')
on conflict (id) do nothing;
insert into public.circle_members(circle_id, user_id, role) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'MEMBER') on conflict do nothing;

insert into public.challenges (id, circle_id, creator_id, title, description, rules, type, status, start_at, end_at, timezone, recurrence, validation_type, evidence_required)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Agosto sin vaguear', 'Tres entrenamientos por semana. Sin excusas.', 'La foto debe hacerse el mismo día. El rival valida.', 'FREQUENCY', 'ACTIVE', date_trunc('day', now()) - interval '7 days', date_trunc('day', now()) + interval '24 days', 'Europe/Madrid', 'FREQ=WEEKLY;BYDAY=MO,WE,FR', 'PEER_REVIEW', true)
on conflict (id) do nothing;
insert into public.challenge_participants(challenge_id, user_id, acceptance, accepted_at, score) values
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ACCEPTED', now(), 40),
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ACCEPTED', now(), 30)
on conflict do nothing;
insert into public.goals(id, challenge_id, name, recurrence, base_points, streak_every, streak_points, evidence_required, evidence_type)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Entrenar', 'FREQ=WEEKLY;BYDAY=MO,WE,FR', 10, 3, 5, true, 'PHOTO')
on conflict (id) do nothing;
insert into public.goal_occurrences(id, goal_id, challenge_id, participant_id, starts_at, closes_at) values
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', date_trunc('day', now()), date_trunc('day', now()) + interval '1 day' - interval '1 second'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', date_trunc('day', now()), date_trunc('day', now()) + interval '1 day' - interval '1 second')
on conflict do nothing;
insert into public.activities(circle_id, challenge_id, actor_id, type, payload) values
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'STREAK_INCREASED', '{"displayName":"Carmen","streak":3}'),
('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CHALLENGE_LEAD', '{"displayName":"Raúl","difference":10}');
