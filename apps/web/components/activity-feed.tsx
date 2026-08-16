"use client";
import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";
import { Avatar } from "./avatar";

const EMOJIS = ["🔥", "💪", "👏", "⚡"] as const;

interface Activity {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
  actor_id: string | null;
  profiles: { display_name?: string; avatar_path?: string | null } | null;
  challenges: { title?: string } | null;
  reactions: Array<{ user_id: string; emoji: string }>;
}

function describeActivity(activity: Activity): string {
  const actorName =
    activity.profiles?.display_name ??
    (activity.payload.displayName as string | undefined) ??
    "Alguien";
  const challengeTitle =
    (activity.payload.challengeTitle as string | undefined) ??
    (activity.payload.title as string | undefined) ??
    activity.challenges?.title ??
    "un reto";
  switch (activity.type) {
    case "CHALLENGE_CREATED":
      return `${actorName} ha propuesto «${challengeTitle}»`;
    case "CHALLENGE_COMPLETED":
      return `«${challengeTitle}» ha terminado`;
    case "CHECK_IN_APPROVED":
      return `${actorName} ha clavado «${(activity.payload.goalName as string) ?? challengeTitle}» (+${(activity.payload.points as number) ?? 0} pt)`;
    case "STREAK_INCREASED":
      return `${actorName} lleva ${(activity.payload.streak as number) ?? 0} días de racha`;
    case "CHALLENGE_LEAD":
      return `${actorName} manda por ${(activity.payload.difference as number) ?? 0} pt`;
    default:
      return actorName;
  }
}

export function ActivityFeed({
  activities,
  currentUserId,
}: {
  activities: Activity[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [optimisticActivities, applyOptimisticReaction] = useOptimistic(
    activities,
    (state, update: { activityId: string; emoji: string; removing: boolean }) =>
      state.map((activity) => {
        if (activity.id !== update.activityId) return activity;
        const reactions = activity.reactions.filter(
          (item) => item.user_id !== currentUserId,
        );
        if (!update.removing)
          reactions.push({ user_id: currentUserId, emoji: update.emoji });
        return { ...activity, reactions };
      }),
  );

  async function react(activityId: string, emoji: string, mine: string | null) {
    const removing = mine === emoji;
    setBusyId(activityId);
    // Optimista: la reacción cambia al instante en pantalla; el
    // router.refresh() posterior reconcilia con el estado real del
    // servidor (y revierte solo si la petición ha fallado).
    applyOptimisticReaction({ activityId, emoji, removing });
    await fetch(
      `/api/v1/activities/${activityId}/reactions`,
      removing
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          },
    ).catch(() => undefined);
    setBusyId(null);
    router.refresh();
  }

  if (optimisticActivities.length === 0)
    return (
      <p className="muted" style={{ padding: "4px 2px" }}>
        Aún no hay actividad. En cuanto alguien proponga o cumpla un reto,
        aparecerá aquí.
      </p>
    );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {optimisticActivities.map((activity) => {
        const mine =
          activity.reactions.find((item) => item.user_id === currentUserId)
            ?.emoji ?? null;
        const counts = new Map<string, number>();
        for (const reaction of activity.reactions)
          counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
        return (
          <article
            key={activity.id}
            className="stitch-card"
            style={{ padding: 14, display: "flex", gap: 12 }}
          >
            <Avatar
              name={activity.profiles?.display_name ?? "Pique"}
              size={36}
              src={
                activity.profiles?.avatar_path && activity.actor_id
                  ? `/api/v1/media/profiles/${activity.actor_id}`
                  : null
              }
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                {describeActivity(activity)}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {EMOJIS.map((emoji) => {
                  const count = counts.get(emoji) ?? 0;
                  const active = mine === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      disabled={busyId === activity.id}
                      onClick={() => void react(activity.id, emoji, mine)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 9px",
                        borderRadius: 999,
                        border: active
                          ? "1px solid var(--violet)"
                          : "1px solid var(--line)",
                        background: active
                          ? "rgb(210 187 255 / 14%)"
                          : "transparent",
                        color: "var(--ink)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {emoji}
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
