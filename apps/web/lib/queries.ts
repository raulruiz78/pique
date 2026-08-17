import { createServerSupabase, getCurrentUser } from "./supabase/server";

function dateParts(date: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return values as Record<string, number>;
}

function localMidnightUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
) {
  const expected = Date.UTC(year, month - 1, day);
  let result = expected;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = dateParts(new Date(result), timeZone);
    const represented = Date.UTC(
      actual.year!,
      actual.month! - 1,
      actual.day!,
      actual.hour!,
      actual.minute!,
      actual.second!,
    );
    result += expected - represented;
  }
  return new Date(result);
}

export function dayBounds(date: Date, timeZone: string) {
  const local = dateParts(date, timeZone);
  const start = localMidnightUtc(
    local.year!,
    local.month!,
    local.day!,
    timeZone,
  );
  const nextLocalDay = new Date(
    Date.UTC(local.year!, local.month! - 1, local.day! + 1),
  );
  const next = {
    year: nextLocalDay.getUTCFullYear(),
    month: nextLocalDay.getUTCMonth() + 1,
    day: nextLocalDay.getUTCDate(),
  };
  return {
    start,
    end: localMidnightUtc(next.year, next.month, next.day, timeZone),
  };
}

export function weekBounds(date: Date, timeZone: string) {
  const local = dateParts(date, timeZone);
  const asUtcDate = new Date(
    Date.UTC(local.year!, local.month! - 1, local.day!),
  );
  const weekday = asUtcDate.getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  const monday = new Date(asUtcDate);
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  return {
    start: localMidnightUtc(
      monday.getUTCFullYear(),
      monday.getUTCMonth() + 1,
      monday.getUTCDate(),
      timeZone,
    ),
    end: localMidnightUtc(
      nextMonday.getUTCFullYear(),
      nextMonday.getUTCMonth() + 1,
      nextMonday.getUTCDate(),
      timeZone,
    ),
  };
}

export async function weeklySummaryQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const { start, end } = weekBounds(
    new Date(),
    profile.data?.timezone ?? "Europe/Madrid",
  );
  const [points, checkIns] = await Promise.all([
    supabase
      .from("score_transactions")
      .select("points")
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "APPROVED")
      .gte("submitted_at", start.toISOString())
      .lt("submitted_at", end.toISOString()),
  ]);
  const weekPoints = (points.data ?? []).reduce(
    (sum, row) => sum + row.points,
    0,
  );
  return { weekPoints, weekCheckIns: checkIns.count ?? 0 };
}

// dashboardQuery() original se dividió en piezas más pequeñas (auditoría de
// rendimiento 0.8.4): /calendario y /validaciones pagaban por las 5 queries
// en paralelo (incluida la generación de URLs firmadas de evidencia) aunque
// solo necesitaran el perfil o las revisiones pendientes respectivamente.
// De paso, `participants` y `activities` no los leía ningún caller — se
// han retirado en vez de trasladarlos.

export async function profileSummaryQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await supabase
    .from("profiles")
    .select(
      "id,display_name,username,avatar_path,total_points,current_streak,timezone",
    )
    .eq("id", user.id)
    .single();
  return { user, profile: profile.data };
}

export async function todayOccurrencesQuery(timezone: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { start, end } = dayBounds(new Date(), timezone);
  const { data } = await supabase
    .from("goal_occurrences")
    .select(
      "id,starts_at,closes_at,status,goals(id,name,recurrence,base_points,evidence_required),challenges(id,title,category),check_ins(id,validations(reason,decision,created_at))",
    )
    .eq("participant_id", user.id)
    .lt("starts_at", end.toISOString())
    .gte("closes_at", start.toISOString())
    .order("starts_at");
  return data ?? [];
}

export async function unreadNotificationsCountQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const user = await getCurrentUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return count ?? 0;
}

export async function pendingReviewsQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data: reviews } = await supabase
    .from("check_ins")
    .select(
      "id,note,submitted_at,user_id,profiles(display_name,avatar_path),challenges(title)",
    )
    .eq("status", "PENDING_REVIEW")
    .neq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(50);
  const reviewRows = reviews ?? [];
  const evidenceByCheckIn = new Map<string, string>();
  if (reviewRows.length > 0) {
    const { data: evidenceRows } = await supabase
      .from("evidence")
      .select("check_in_id,storage_path")
      .in(
        "check_in_id",
        reviewRows.map((review) => review.id),
      );
    await Promise.all(
      (evidenceRows ?? []).map(async (evidence) => {
        if (!evidence.check_in_id) return;
        const { data: signed } = await supabase.storage
          .from("evidence")
          .createSignedUrl(evidence.storage_path, 300);
        if (signed?.signedUrl)
          evidenceByCheckIn.set(evidence.check_in_id, signed.signedUrl);
      }),
    );
  }
  return reviewRows.map((review) => ({
    ...review,
    evidenceUrl: evidenceByCheckIn.get(review.id) ?? null,
  }));
}

export async function myCheckInsQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select(
      "id,note,status,submitted_at,reviewed_at,challenges(title),goal_occurrences(starts_at,closes_at,goals(name)),validations(decision,reason,created_at,reviewer_id,profiles(display_name))",
    )
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(50);
  const rows = checkIns ?? [];
  const pendingIds = rows
    .filter((row) => row.status === "PENDING_REVIEW")
    .map((row) => row.id);
  const evidenceByCheckIn = new Map<string, string>();
  if (pendingIds.length > 0) {
    const { data: evidenceRows } = await supabase
      .from("evidence")
      .select("check_in_id,storage_path")
      .in("check_in_id", pendingIds);
    await Promise.all(
      (evidenceRows ?? []).map(async (evidence) => {
        if (!evidence.check_in_id) return;
        const { data: signed } = await supabase.storage
          .from("evidence")
          .createSignedUrl(evidence.storage_path, 300);
        if (signed?.signedUrl)
          evidenceByCheckIn.set(evidence.check_in_id, signed.signedUrl);
      }),
    );
  }
  return rows.map((row) => ({
    ...row,
    evidenceUrl: evidenceByCheckIn.get(row.id) ?? null,
  }));
}

export async function calendarQuery(from: Date, to: Date) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("goal_occurrences")
    .select(
      "id,starts_at,closes_at,status,goals(id,name,recurrence,base_points),challenges(id,title,category)",
    )
    .eq("participant_id", user.id)
    .lte("starts_at", to.toISOString())
    .gte("closes_at", from.toISOString())
    .order("starts_at");
  return data ?? [];
}

export async function leaderboardQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("challenge_participants")
    .select(
      "user_id,score,current_streak,profiles(display_name,username),challenges!inner(id,title,status,circle_id,circles(name))",
    )
    .in("challenges.status", ["ACTIVE", "COMPLETED"])
    .order("score", { ascending: false });
  return data ?? [];
}
