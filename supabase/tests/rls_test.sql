begin;
select plan(4);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.circles where id='20000000-0000-0000-0000-000000000001'),1,'miembro puede leer su círculo');
select is((select count(*)::integer from public.challenges where id='30000000-0000-0000-0000-000000000001'),1,'participante puede leer su reto');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.circles where id='20000000-0000-0000-0000-000000000001'),0,'usuario ajeno no puede leer círculo');
select throws_ok($$insert into public.score_transactions(challenge_id,user_id,points,source_type,source_id,reason) values('30000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001',999,'CHEAT',gen_random_uuid(),'CHEAT')$$,'42501',null,'cliente no puede asignarse puntos');
select * from finish();
rollback;

