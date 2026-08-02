-- Expose the RLS-protected application tables to authenticated API clients.
-- RLS remains the authority that decides which rows each user may access.

grant usage on schema public to authenticated;

grant select on table
  public.profiles,
  public.friendships,
  public.circles,
  public.circle_members,
  public.circle_invites,
  public.challenges,
  public.challenge_participants,
  public.goals,
  public.goal_occurrences,
  public.check_ins,
  public.evidence,
  public.validations,
  public.score_transactions,
  public.penalties,
  public.rewards,
  public.notifications,
  public.devices,
  public.activities,
  public.reactions,
  public.idempotency_keys,
  public.reports
to authenticated;

grant update on table public.profiles to authenticated;

grant insert, update, delete on table public.friendships to authenticated;

grant insert, update on table public.circles to authenticated;
grant delete on table public.circle_members to authenticated;
grant insert on table public.circle_invites to authenticated;

grant insert, update on table
  public.challenges,
  public.challenge_participants
to authenticated;

grant insert, update, delete on table public.goals to authenticated;
grant insert on table public.evidence to authenticated;

grant update on table public.notifications to authenticated;
grant insert, update, delete on table public.devices to authenticated;
grant insert, update, delete on table public.reactions to authenticated;
grant insert on table public.idempotency_keys to authenticated;
grant insert on table public.reports to authenticated;

-- Check-in routes store an idempotency key after the RPC succeeds.
create policy idempotency_self_insert on public.idempotency_keys
for insert to authenticated
with check (user_id = auth.uid());
