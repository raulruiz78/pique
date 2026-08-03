import { createServerSupabase } from "./supabase/server";

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

export async function dashboardQuery() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await supabase
    .from("profiles")
    .select(
      "id,display_name,username,avatar_path,total_points,current_streak,timezone",
    )
    .eq("id", user.id)
    .single();
  const { start, end } = dayBounds(
    new Date(),
    profile.data?.timezone ?? "Europe/Madrid",
  );
  const [occurrences, participants, activities, reviews, unreadNotifications] =
    await Promise.all([
      supabase
        .from("goal_occurrences")
        .select(
          "id,starts_at,closes_at,status,goals(id,name,recurrence,base_points,evidence_required),challenges(id,title,category)",
        )
        .eq("participant_id", user.id)
        .lt("starts_at", end.toISOString())
        .gte("closes_at", start.toISOString())
        .order("starts_at"),
      supabase
        .from("challenge_participants")
        .select(
          "user_id,score,current_streak,challenges!inner(circle_id,status),profiles(display_name,username,avatar_path)",
        )
        .in("challenges.status", ["ACTIVE", "SCHEDULED"])
        .order("score", { ascending: false })
        .limit(5),
      supabase
        .from("activities")
        .select("id,type,payload,created_at,profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("check_ins")
        .select(
          "id,note,submitted_at,user_id,profiles(display_name,avatar_path),challenges(title)",
        )
        .eq("status", "PENDING_REVIEW")
        .neq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(50),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
  const reviewRows = reviews.data ?? [];
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
  return {
    user,
    profile: profile.data,
    occurrences: occurrences.data ?? [],
    participants: participants.data ?? [],
    activities: activities.data ?? [],
    reviews: reviewRows.map((review) => ({
      ...review,
      evidenceUrl: evidenceByCheckIn.get(review.id) ?? null,
    })),
    unreadNotifications: unreadNotifications.count ?? 0,
  };
}

export async function calendarQuery(from: Date, to: Date) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
