"use client";
import { Check, Clock3, LoaderCircle, X } from "lucide-react";
import { useChallengeResponse } from "@/hooks/use-challenge-response";
import { SwipeCard } from "./swipe-card";

// Deck de retos pendientes de /circulos/[circleId] (docs/features/motion-system.md,
// 0.8.9.2): el swipe es un atajo sobre los mismos botones ya existentes en
// ChallengeActions, nunca la única forma de responder.
export function PendingChallengeCard({
  challengeId,
  title,
}: {
  challengeId: string;
  title: string;
}) {
  const { responded, respond } = useChallengeResponse(challengeId);

  if (responded)
    return (
      <article
        className="card"
        style={{ padding: 18, borderLeft: "5px solid var(--coral)" }}
      >
        <span
          className={`pill ${responded === "ACCEPTED" ? "pill-lime" : "pill-violet"}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            width: "fit-content",
          }}
        >
          <LoaderCircle size={13} className="animate-spin" />
          {responded === "ACCEPTED" ? "Aceptando…" : "Rechazando…"}
        </span>
      </article>
    );

  return (
    <SwipeCard
      onSwipeLeft={() => respond("REJECTED")}
      onSwipeRight={() => respond("ACCEPTED")}
      leftLabel="Rechazar"
      rightLabel="Aceptar"
    >
      <article
        className="card"
        style={{ padding: 18, borderLeft: "5px solid var(--coral)" }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <Clock3 color="var(--coral)" />
          <div>
            <b>{title}</b>
            <small className="muted" style={{ display: "block", marginTop: 3 }}>
              Te han retado. Revisa y responde.
            </small>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            className="button button-secondary"
            onClick={() => respond("REJECTED")}
          >
            <X size={18} />
            Rechazar
          </button>
          <button
            className="button button-primary"
            onClick={() => respond("ACCEPTED")}
          >
            <Check size={18} />
            Aceptar reto
          </button>
        </div>
      </article>
    </SwipeCard>
  );
}
