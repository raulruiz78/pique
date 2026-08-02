-- Allow trusted maintenance code to inspect and remove circles. Related rows
-- are removed through the schema's existing foreign-key cascades.
grant usage on schema public to service_role;
grant select, delete on table public.circles to service_role;
