"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, Check, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/bottom-sheet";
import { CameraCapture } from "@/components/camera-capture";
import { PiqueCoin } from "@/components/pique-coin";
import { tap } from "@/lib/haptics";
import { createBrowserSupabase } from "@/lib/supabase/browser";

async function hashFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function CheckInButton({
  occurrenceId,
  evidenceRequired,
  title,
  resubmit = false,
  shieldCount = 0,
}: {
  occurrenceId: string;
  evidenceRequired: boolean;
  title: string;
  /** El check-in anterior de esta ocurrencia fue rechazado — esto es un
   * reintento, no el primer envío. */
  resubmit?: boolean;
  /** Comodines disponibles en el círculo de este reto — si hay al menos
   * uno, se ofrece saltar el check-in en vez de subir prueba. */
  shieldCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shielding, setShielding] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  async function useShield() {
    setShielding(true);
    try {
      const response = await fetch(
        `/api/v1/occurrences/${occurrenceId}/shield`,
        { method: "POST" },
      );
      const body = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(body.error?.message ?? "No se pudo usar el comodín.");
      toast.success("Comodín usado. Racha a salvo.");
      tap(15);
      setOpen(false);
      setSubmitted(true);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo usar el comodín.",
      );
    } finally {
      setShielding(false);
    }
  }
  async function submit() {
    if (evidenceRequired && !file)
      return toast.error("Este reto necesita una foto.");
    if (!navigator.onLine) {
      localStorage.setItem(
        `pique-pending-${occurrenceId}`,
        JSON.stringify({
          occurrenceId,
          note,
          createdAt: new Date().toISOString(),
        }),
      );
      setOpen(false);
      return toast.info(
        "Guardado sin conexión. Añade la foto y envíalo cuando vuelvas.",
      );
    }
    setLoading(true);
    try {
      let evidence: Record<string, unknown> | undefined;
      if (file) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
        )
          throw new Error(
            "La foto debe ser JPEG, PNG o WebP y pesar menos de 10 MB.",
          );
        const uploadResponse = await fetch("/api/v1/evidence/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrenceId,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const uploadBody = (await uploadResponse.json()) as {
          data?: { path: string; token: string };
          error?: { message: string };
        };
        if (!uploadResponse.ok || !uploadBody.data)
          throw new Error(
            uploadBody.error?.message ?? "No se pudo preparar la foto.",
          );
        const { error } = await createBrowserSupabase()
          .storage.from("evidence")
          .uploadToSignedUrl(
            uploadBody.data.path,
            uploadBody.data.token,
            file,
            { contentType: file.type },
          );
        if (error) throw error;
        evidence = {
          storagePath: uploadBody.data.path,
          mimeType: file.type,
          sizeBytes: file.size,
          sha256: await hashFile(file),
        };
      }
      const response = await fetch(
        `/api/v1/occurrences/${occurrenceId}/check-ins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({ note: note || undefined, evidence }),
        },
      );
      const body = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(body.error?.message ?? "No se pudo registrar.");
      localStorage.removeItem(`pique-pending-${occurrenceId}`);
      toast.success("Check-in enviado. ¡Bien jugado!");
      tap(15);
      setOpen(false);
      // Optimista: en cuanto el servidor confirma, mostramos el estado
      // "enviado" al instante en vez de esperar a que termine el refresh
      // completo de la página (que igualmente llegará justo después y
      // sustituirá este botón por la tarjeta ya marcada como lista).
      setSubmitted(true);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar.",
      );
    } finally {
      setLoading(false);
    }
  }
  if (submitted)
    return (
      <span
        className="pill pill-lime motion-pop"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <Check size={14} /> Enviado
      </span>
    );
  return (
    <BottomSheet
      open={open}
      onOpenChange={setOpen}
      ariaDescribedBy="check-description"
      trigger={
        <button
          className={
            resubmit ? "button button-secondary" : "button button-lime"
          }
        >
          <Check size={18} /> {resubmit ? "Subir de nuevo" : "Hecho"}
        </button>
      }
    >
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <div>
            <span className="eyebrow">Verificación</span>
            <Dialog.Title
              className="display"
              style={{ fontSize: 35, margin: "7px 0" }}
            >
              {resubmit ? "Corrige tu prueba" : "Sube tu prueba"}
            </Dialog.Title>
          </div>
          <Dialog.Close
            className="button button-secondary"
            aria-label="Cerrar"
            style={{ width: 44, padding: 0 }}
          >
            <X />
          </Dialog.Close>
        </div>
        <Dialog.Description
          id="check-description"
          className="muted"
          style={{ lineHeight: 1.5 }}
        >
          {resubmit
            ? "Tu rival la rechazó. Sube una prueba que deje claro que sí lo has hecho."
            : "Asegúrate de que el resultado sea visible para que tu círculo pueda validarlo."}
        </Dialog.Description>
        <span className="pill pill-violet">{title}</span>
        {shieldCount > 0 && (
          <button
            type="button"
            className="stitch-card"
            disabled={shielding}
            onClick={useShield}
            style={{
              width: "100%",
              marginTop: 16,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              color: "inherit",
              cursor: "pointer",
              borderColor: "var(--lime)",
            }}
          >
            <ShieldCheck color="var(--lime)" />
            <span style={{ flex: 1 }}>
              <b>Usar comodín — sáltate esto</b>
              <small className="muted" style={{ display: "block" }}>
                Sin foto, sin puntos. Solo salva la racha. Te quedan{" "}
                {shieldCount}.
              </small>
            </span>
            {shielding ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <PiqueCoin size={20} />
            )}
          </button>
        )}
        <div style={{ display: "grid", gap: 15, marginTop: 20 }}>
          <div>
            <span className="field-label">
              Foto {evidenceRequired ? "obligatoria" : "opcional"}
            </span>
            <span style={{ display: "block", position: "relative" }}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="evidence-preview"
                  src={preview}
                  alt="Vista previa de la evidencia"
                />
              ) : (
                <button
                  type="button"
                  className="stitch-card"
                  onClick={() => setCameraOpen(true)}
                  style={{
                    width: "100%",
                    minHeight: 260,
                    display: "grid",
                    placeItems: "center",
                    borderStyle: "dashed",
                    border: "1px dashed var(--line)",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ textAlign: "center" }}>
                    <Camera size={38} />
                    <b style={{ display: "block", marginTop: 12 }}>
                      Toca para añadir la foto
                    </b>
                  </span>
                </button>
              )}
              <button
                type="button"
                aria-label="Cambiar foto"
                className="button button-secondary"
                onClick={() => setCameraOpen(true)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                  width: 48,
                  padding: 0,
                }}
              >
                <Camera size={19} />
              </button>
            </span>
          </div>
          {cameraOpen && (
            <CameraCapture
              onCancel={() => setCameraOpen(false)}
              onConfirm={(blob) => {
                setCameraOpen(false);
                if (preview) URL.revokeObjectURL(preview);
                const nextFile = new File(
                  [blob],
                  `evidencia-${Date.now()}.jpg`,
                  { type: blob.type },
                );
                setFile(nextFile);
                setPreview(URL.createObjectURL(blob));
              }}
            />
          )}
          <label>
            <span className="field-label">Nota opcional</span>
            <textarea
              className="field"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onFocus={(event) => {
                // El teclado móvil tapa la nota porque la hoja inferior
                // no se desplaza sola al enfocar — iOS necesita un
                // margen para que la animación del teclado termine antes
                // de calcular hasta dónde hay que subir.
                const field = event.currentTarget;
                setTimeout(
                  () =>
                    field.scrollIntoView({
                      block: "center",
                      behavior: "smooth",
                    }),
                  300,
                );
              }}
              maxLength={140}
              placeholder="¿Cómo te has sentido hoy?"
            />
          </label>
          <button
            className="button button-lime"
            disabled={loading}
            onClick={submit}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Check />}{" "}
            {resubmit ? "Reenviar" : "Confirmar hecho"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
