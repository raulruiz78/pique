-- Minimum table privileges required by the authenticated maintenance route.
-- The service-role JWT bypasses RLS, while these grants limit its SQL surface.
grant select, update on table
  public.goal_occurrences,
  public.challenge_participants,
  public.profiles,
  public.outbox_events
to service_role;

grant select on table public.challenges to service_role;
