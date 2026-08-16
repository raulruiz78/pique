"use client";
import { Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { Confetti } from "./confetti";

const LEVEL_SPAN = 500;
const RANK_UP_MS = 1800;
const LEVEL_UP_MS = 1500;

type StoredProgress = { points: number; level: number; tier: string };

function progressPercent(points: number) {
  return ((points % LEVEL_SPAN) / LEVEL_SPAN) * 100;
}

// Barra de nivel + celebraciones (docs/features/motion-system.md, 0.8.9.3).
// Esta página no tiene datos en vivo (Server Component, sin realtime), así
// que "antes/después" se compara contra el último valor visto guardado en
// localStorage por este mismo navegador — no se fabrica ningún delta que el
// servidor no dé, solo se recuerda lo último visto.
export function LevelProgress({
  userId,
  points,
  level,
  tier,
}: {
  userId: string;
  points: number;
  level: number;
  tier: string;
}) {
  const storageKey = `pique-progress-${userId}`;
  const [displayProgress, setDisplayProgress] = useState(
    progressPercent(points),
  );
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [rankUp, setRankUp] = useState<string | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const raw = localStorage.getItem(storageKey);
    localStorage.setItem(
      storageKey,
      JSON.stringify({ points, level, tier } satisfies StoredProgress),
    );
    if (!raw || reducedMotion) return;
    let prev: StoredProgress;
    try {
      prev = JSON.parse(raw) as StoredProgress;
    } catch {
      return;
    }
    if (prev.points !== points) {
      requestAnimationFrame(() => {
        setDisplayProgress(progressPercent(prev.points));
        requestAnimationFrame(() =>
          setDisplayProgress(progressPercent(points)),
        );
      });
    }
    if (level > prev.level) requestAnimationFrame(() => setLevelUp(level));
    if (tier !== prev.tier) requestAnimationFrame(() => setRankUp(tier));
  }, [storageKey, points, level, tier]);

  useEffect(() => {
    if (levelUp === null) return;
    const timer = setTimeout(() => setLevelUp(null), LEVEL_UP_MS);
    return () => clearTimeout(timer);
  }, [levelUp]);

  useEffect(() => {
    if (rankUp === null) return;
    const timer = setTimeout(() => setRankUp(null), RANK_UP_MS);
    return () => clearTimeout(timer);
  }, [rankUp]);

  return (
    <section
      className="stitch-card"
      style={{
        padding: 20,
        marginTop: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
        }}
      >
        <div>
          <span className="field-label muted">Tu nivel</span>
          <strong
            className="display"
            style={{ color: "var(--violet)", fontSize: 28 }}
          >
            {tier} {level}
          </strong>
        </div>
        <Crown color="var(--lime)" size={32} />
      </div>
      <div className="wizard-progress-track" style={{ marginTop: 16 }}>
        <div
          className="wizard-progress-fill"
          style={{ width: `${displayProgress}%`, background: "var(--lime)" }}
        />
      </div>
      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        {LEVEL_SPAN - (points % LEVEL_SPAN)} puntos para el nivel {level + 1}
      </small>
      {levelUp !== null && (
        <div
          className="motion-pop"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "grid",
            placeItems: "center",
            background: "rgb(19 19 19 / 92%)",
          }}
        >
          <strong className="display" style={{ fontSize: 22 }}>
            ¡Nivel {levelUp}!
          </strong>
        </div>
      )}
      {rankUp !== null && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Cerrar"
          onClick={() => setRankUp(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setRankUp(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 95,
            display: "grid",
            placeItems: "center",
            background: "rgb(0 0 0 / 82%)",
            cursor: "pointer",
          }}
        >
          <div
            className="motion-pop"
            style={{ position: "relative", textAlign: "center", padding: 40 }}
          >
            <Confetti />
            <span className="eyebrow">Nuevo rango</span>
            <strong
              className="display"
              style={{ display: "block", fontSize: 38, marginTop: 8 }}
            >
              {rankUp}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}
