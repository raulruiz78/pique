"use client";
import { Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ReviewButtons({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const [reviewed, setReviewed] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );

  async function review(decision: "APPROVED" | "REJECTED") {
    // Optimista, mismo patrón que challenge-actions.tsx/check-in-button.tsx:
    // el estado local se ve al instante, el refresh posterior reconcilia con
    // la lista real de validaciones pendientes.
    setReviewed(decision);
    const response = await fetch(`/api/v1/check-ins/${checkInId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ decision }),
    });
    const body = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      setReviewed(null);
      return toast.error(body.error?.message ?? "No se pudo revisar.");
    }
    toast.success(
      decision === "APPROVED"
        ? "Validado. Los puntos ya cuentan."
        : "Evidencia rechazada.",
    );
    router.refresh();
  }

  if (reviewed)
    return (
      <span
        className={`pill ${reviewed === "APPROVED" ? "pill-lime" : "pill-violet"} motion-pop`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "fit-content",
        }}
      >
        <LoaderCircle size={13} className="animate-spin" />
        {reviewed === "APPROVED" ? "Validando…" : "Rechazando…"}
      </span>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.35fr",
        gap: 10,
        width: "100%",
      }}
    >
      <button
        aria-label="Rechazar"
        className="button button-secondary"
        onClick={() => review("REJECTED")}
      >
        <X size={18} /> Rechazar
      </button>
      <button className="button button-lime" onClick={() => review("APPROVED")}>
        <Check size={18} /> Validar
      </button>
    </div>
  );
}
