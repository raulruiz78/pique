"use client";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type AchievementItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  unlocked: boolean;
  description: string;
};

// Pop al desbloquear un logro (docs/features/motion-system.md, 0.8.9.3):
// compara contra el último set de logros desbloqueados guardado en
// localStorage por este navegador. Sin valor previo (primera visita), no
// celebra nada — solo pinta el estado actual.
export function AchievementScroll({
  userId,
  achievements,
}: {
  userId: string;
  achievements: AchievementItem[];
}) {
  const storageKey = `pique-achievements-${userId}`;
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const raw = localStorage.getItem(storageKey);
    localStorage.setItem(
      storageKey,
      JSON.stringify(
        achievements.filter((item) => item.unlocked).map((item) => item.key),
      ),
    );
    if (!raw || reducedMotion) return;
    const prevUnlocked = new Set<string>(JSON.parse(raw) as string[]);
    const fresh = achievements
      .filter((item) => item.unlocked && !prevUnlocked.has(item.key))
      .map((item) => item.key);
    if (fresh.length)
      requestAnimationFrame(() => setJustUnlocked(new Set(fresh)));
  }, [storageKey, achievements]);

  return (
    <div className="achievement-scroll">
      {achievements.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <div
            key={achievement.key}
            className={
              justUnlocked.has(achievement.key)
                ? "stitch-card motion-pop"
                : "stitch-card"
            }
            style={{
              padding: 16,
              minWidth: 140,
              textAlign: "center",
              opacity: achievement.unlocked ? 1 : 0.38,
            }}
          >
            <Icon
              color={achievement.unlocked ? "var(--lime)" : "var(--muted)"}
            />
            <small className="field-label" style={{ margin: "12px 0 0" }}>
              {achievement.label}
            </small>
            <small className="muted" style={{ display: "block", marginTop: 6 }}>
              {achievement.description}
            </small>
          </div>
        );
      })}
    </div>
  );
}
