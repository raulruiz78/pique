"use client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export function ReviewButtons({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  async function review(decision: "APPROVED" | "REJECTED") {
    const response = await fetch(`/api/v1/check-ins/${checkInId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ decision }),
    });
    const body = (await response.json()) as { error?: { message: string } };
    if (!response.ok)
      return toast.error(body.error?.message ?? "No se pudo revisar.");
    toast.success(
      decision === "APPROVED"
        ? "Validado. Los puntos ya cuentan."
        : "Evidencia rechazada.",
    );
    router.refresh();
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        aria-label="Rechazar"
        className="button button-secondary"
        style={{ width: 46, padding: 0 }}
        onClick={() => review("REJECTED")}
      >
        <X size={18} />
      </button>
      <button
        className="button button-primary"
        onClick={() => review("APPROVED")}
      >
        <Check size={18} /> Validar
      </button>
    </div>
  );
}
