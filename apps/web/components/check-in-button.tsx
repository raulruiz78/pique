"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
}: {
  occurrenceId: string;
  evidenceRequired: boolean;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button button-lime">
          <Check size={18} /> Hecho
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgb(16 12 24 / 60%)",
            zIndex: 80,
          }}
        />
        <Dialog.Content
          aria-describedby="check-description"
          className="card"
          style={{
            position: "fixed",
            zIndex: 81,
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            width: "min(calc(100% - 24px), 500px)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <span className="eyebrow">Check-in</span>
              <Dialog.Title
                className="display"
                style={{ fontSize: 35, margin: "7px 0" }}
              >
                {title}: hecho.
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
            Deja una prueba rápida. La hora válida será la del servidor.
          </Dialog.Description>
          <div style={{ display: "grid", gap: 15, marginTop: 20 }}>
            <label>
              <span className="field-label">
                Foto {evidenceRequired ? "obligatoria" : "opcional"}
              </span>
              <span
                className="button button-secondary"
                style={{ width: "100%" }}
              >
                <Camera size={18} />
                {file ? file.name : "Elegir foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  hidden
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </span>
            </label>
            <label>
              <span className="field-label">Nota opcional</span>
              <textarea
                className="field"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Entreno terminado. Costó, pero salió."
              />
            </label>
            <button
              className="button button-primary"
              disabled={loading}
              onClick={submit}
            >
              {loading ? <LoaderCircle className="animate-spin" /> : <Check />}{" "}
              Enviar check-in
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
