"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useChallengeResponse(challengeId: string) {
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
      toast.error("No se pudo responder al reto.");
      return;
    }
    toast.success(
      response === "ACCEPTED"
        ? "Reto aceptado. ¡A por ello!"
        : "Reto rechazado.",
    );
    router.refresh();
  }

  return { responded, respond };
}
