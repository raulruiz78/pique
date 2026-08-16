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
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function review(decision: "APPROVED" | "REJECTED", note?: string) {
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
      body: JSON.stringify(note ? { decision, reason: note } : { decision }),
    });
    const body = (await response.json()) as { error?: { message: string } };
    if (!response.ok) {
      setReviewed(null);
      return toast.error(body.error?.message ?? "No se pudo revisar.");
    }
    toast.success(
      decision === "APPROVED"
        ? "Validado. Los puntos ya cuentan."
        : "Evidencia rechazada. Puede volver a intentarlo.",
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

  if (rejecting)
    return (
      <div style={{ display: "grid", gap: 10, width: "100%" }}>
        <textarea
          className="field"
          rows={2}
          autoFocus
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="¿Por qué lo rechazas? Le ayuda a corregirlo (opcional, pero se agradece)."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.35fr",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setRejecting(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={() => review("REJECTED", reason.trim() || undefined)}
          >
            <X size={18} /> Confirmar rechazo
          </button>
        </div>
      </div>
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
        onClick={() => setRejecting(true)}
      >
        <X size={18} /> Rechazar
      </button>
      <button className="button button-lime" onClick={() => review("APPROVED")}>
        <Check size={18} /> Validar
      </button>
    </div>
  );
}
