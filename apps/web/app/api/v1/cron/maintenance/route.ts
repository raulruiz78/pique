import { flushPendingPush } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { fail, ok, requestId } from "@/lib/api";
async function runMaintenance(request: Request) {
  const id = requestId(request);
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return fail("NOT_AUTHORIZED", "No autorizado.", id, 401);
  const admin = createAdminSupabase();
  if (!admin)
    return fail("SERVICE_NOT_CONFIGURED", "Servicio no configurado.", id, 503);
  const now = new Date().toISOString();
  const expired = await admin
    .from("goal_occurrences")
    .update({ status: "EXPIRED" })
    .in("status", ["PENDING", "REJECTED"])
    .lt("closes_at", now)
    .select("id,challenge_id,participant_id");
  for (const occurrence of expired.data ?? []) {
    await admin
      .from("challenge_participants")
      .update({ current_streak: 0, streak_days: 0 })
      .eq("challenge_id", occurrence.challenge_id)
      .eq("user_id", occurrence.participant_id);
    await admin
      .from("profiles")
      .update({ current_streak: 0 })
      .eq("id", occurrence.participant_id);
  }
  const autoApproved = await admin.rpc("auto_approve_stale_check_ins");
  const ended = await admin
    .from("challenges")
    .select("id")
    .eq("status", "ACTIVE")
    .lt("end_at", now);
  let completed = 0;
  for (const challenge of ended.data ?? []) {
    const result = await admin.rpc("complete_challenge", {
      target_challenge_id: challenge.id,
    });
    if (!result.error) completed += 1;
  }
  const outbox = await admin
    .from("outbox_events")
    .update({ processed_at: now })
    .is("processed_at", null)
    .lte("available_at", now)
    .select("id")
    .limit(100);

  const streakAtRisk = await admin.rpc("notify_streak_at_risk");
  const occurrencePending = await admin.rpc("notify_occurrence_pending");
  const afternoonReminder = await admin.rpc("notify_afternoon_reminder");
  const rivalAhead = await admin.rpc("notify_rival_ahead");
  const inactiveUsers = await admin.rpc("notify_inactive_users");
  const { pushed } = await flushPendingPush(admin);

  return ok({
    expired: expired.data?.length ?? 0,
    completed,
    autoApproved: autoApproved.data ?? 0,
    outbox: outbox.data?.length ?? 0,
    derived: {
      streakAtRisk: streakAtRisk.data ?? 0,
      occurrencePending: occurrencePending.data ?? 0,
      afternoonReminder: afternoonReminder.data ?? 0,
      rivalAhead: rivalAhead.data ?? 0,
      inactiveUsers: inactiveUsers.data ?? 0,
    },
    pushed,
  });
}

export async function GET(request: Request) {
  return runMaintenance(request);
}

export async function POST(request: Request) {
  return runMaintenance(request);
}
