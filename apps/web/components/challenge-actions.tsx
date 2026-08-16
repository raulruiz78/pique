"use client";
import { Check, LoaderCircle, X } from "lucide-react";
import { useChallengeResponse } from "@/hooks/use-challenge-response";

export function ChallengeActions({ challengeId }: { challengeId: string }) {
  const { responded, respond } = useChallengeResponse(challengeId);
  if (responded)
    return (
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
    );
  return (
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
  );
}
