"use client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export function ChallengeActions({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  async function respond(response: "ACCEPTED" | "REJECTED") {
    const result = await fetch(`/api/v1/challenges/${challengeId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    if (!result.ok) return toast.error("No se pudo responder al reto.");
    toast.success(
      response === "ACCEPTED"
        ? "Reto aceptado. ¡A por ello!"
        : "Reto rechazado.",
    );
    router.refresh();
  }
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
