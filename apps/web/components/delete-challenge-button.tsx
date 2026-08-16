"use client";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteChallengeButton({
  challengeId,
  title,
  active = false,
  redirectTo,
}: {
  challengeId: string;
  title: string;
  /** El reto ya está en marcha: borrarlo también borra el historial
   * (check-ins, puntuación) de los demás participantes. */
  active?: boolean;
  /** Si se borra desde la propia página del reto, esta ya no existe tras
   * eliminarlo — navegar a otro sitio en vez de refrescarla (404). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    const confirmed = window.confirm(
      active
        ? `¿Eliminar «${title}»? Ya está en marcha: también se borrará el historial de check-ins y puntos de quien participe contigo. Esta acción no se puede deshacer.`
        : `¿Eliminar «${title}»? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/challenges/${challengeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        toast.error(body.error?.message ?? "No se pudo eliminar el reto.");
        return;
      }
      toast.success("Reto eliminado.");
      if (redirectTo)
        router.push(redirectTo as Parameters<typeof router.push>[0]);
      else router.refresh();
    } catch {
      toast.error("No se pudo eliminar el reto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={`Eliminar ${title}`}
      title="Eliminar reto"
      className="button button-secondary"
      disabled={deleting}
      onClick={remove}
      style={{ width: 40, height: 40, padding: 0, flexShrink: 0 }}
    >
      {deleting ? (
        <LoaderCircle className="animate-spin" size={16} />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
