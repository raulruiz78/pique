-- Circle deletion is destructive and cascades to all related challenge data.
-- Only the owner may perform it through the authenticated API.
grant delete on table public.circles to authenticated;

create policy circles_owner_delete on public.circles
for delete
using (owner_id = auth.uid());
