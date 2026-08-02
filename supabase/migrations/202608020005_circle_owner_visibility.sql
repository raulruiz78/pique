-- PostgREST returns inserted rows immediately. Let the owner read the new
-- circle directly, without depending on the owner-membership trigger timing.
drop policy if exists circles_member_read on public.circles;
create policy circles_member_read on public.circles
for select to authenticated
using (owner_id = auth.uid() or public.is_circle_member(id));
