"use client";
import { Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
export function ChallengeActions({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [responded, setResponded] = useState<"ACCEPTED" | "REJECTED" | null>(
    null,
  );
  async function respond(response: "ACCEPTED" | "REJECTED") {
    // Optimista: reflejamos la respuesta al instante y solo revertimos si
    // el servidor la rechaza; el refresh que sigue reconcilia con el
    // estado real de la página (banner de "te han retado" desaparece).
    setResponded(response);
    const result = await fetch(`/api/v1/challenges/${challengeId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    if (!result.ok) {
      setResponded(null);
      return toast.error("No se pudo responder al reto.");
    }
    toast.success(
      response === "ACCEPTED"
        ? "Reto aceptado. ¡A por ello!"
        : "Reto rechazado.",
    );
    router.refresh();
  }
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
