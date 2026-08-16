"use client";
import { Check, CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
export function MarkNotificationsRead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  if (done)
    return (
      <span
        className="pill pill-lime"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <Check size={14} /> Al día
      </span>
    );
  return (
    <button
      className="button button-secondary"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const response = await fetch("/api/v1/notifications", {
          method: "PATCH",
        });
        setLoading(false);
        if (!response.ok) return toast.error("No se pudieron marcar.");
        // Optimista: el botón pasa a "Al día" al instante; el refresh
        // posterior sincroniza el resto de la página (contador del icono
        // de campana, bordes de no leído en cada tarjeta).
        setDone(true);
        router.refresh();
      }}
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <CheckCheck size={17} />
      )}
      Marcar leídas
    </button>
  );
}
