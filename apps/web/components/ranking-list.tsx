"use client";
import { useLayoutEffect, useRef } from "react";
import { Avatar } from "./avatar";

type RankingRow = {
  userId: string;
  name: string;
  avatarPath: string | null;
  score: number;
  streak: number;
};

// Reordenación animada de la tabla de ranking (docs/features/motion-system.md,
// 0.8.9.6): FLIP con la Web Animations API sobre las filas ya montadas — solo
// transform, se dispara cuando `players` cambia de orden entre renders (p.
// ej. tras un router.refresh() con este árbol ya montado). Si no hay cambio
// de posición, o es el primer render, no anima nada.
export function RankingList({
  players,
  leaderScore,
  startIndex,
  totalCount,
}: {
  players: RankingRow[];
  leaderScore: number;
  startIndex: number;
  totalCount: number;
}) {
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevRects = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nextRects = new Map<string, DOMRect>();
    for (const [userId, el] of rowRefs.current) {
      const rect = el.getBoundingClientRect();
      nextRects.set(userId, rect);
      const prev = prevRects.current.get(userId);
      if (!reducedMotion && prev) {
        const dy = prev.top - rect.top;
        if (dy)
          el.animate(
            [
              { transform: `translateY(${dy}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 400, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
          );
      }
    }
    prevRects.current = nextRects;
  }, [players]);

  return (
    <>
      {players.map((player, offset) => {
        const index = startIndex + offset;
        const difference = leaderScore - player.score;
        return (
          <div
            key={player.userId}
            ref={(el) => {
              if (el) rowRefs.current.set(player.userId, el);
              else rowRefs.current.delete(player.userId);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "14px 0",
              borderBottom:
                index < totalCount - 1 ? "1px solid var(--line)" : 0,
            }}
          >
            <b
              style={{
                width: 23,
                color: index === 0 ? "var(--gold)" : "var(--muted)",
              }}
            >
              #{index + 1}
            </b>
            <Avatar
              name={player.name}
              size={38}
              accent={index === 0 ? "var(--lime)" : "var(--violet)"}
              src={
                player.avatarPath
                  ? `/api/v1/media/profiles/${player.userId}`
                  : null
              }
            />
            <div style={{ flex: 1 }}>
              <b>{player.name}</b>
              <small className="muted" style={{ display: "block" }}>
                {difference === 0
                  ? `${player.streak} de racha`
                  : `a ${difference} pt del líder`}
              </small>
            </div>
            <strong>{player.score} pt</strong>
          </div>
        );
      })}
    </>
  );
}
