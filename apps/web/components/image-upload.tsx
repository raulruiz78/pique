"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/bottom-sheet";

// El modal de recorte (canvas, arrastre, zoom) solo hace falta tras elegir
// una foto — no en la carga inicial de /perfil ni /circulos/[circleId].
const ImageCropModal = dynamic(
  () => import("./image-crop-modal").then((mod) => mod.ImageCropModal),
  { ssr: false },
);

export function ImageUpload({
  endpoint,
  hasImage,
  label,
  children,
  menu = false,
}: {
  endpoint: string;
  hasImage: boolean;
  label: string;
  children: ReactNode;
  /** En vez de las dos burbujas siempre visibles (cámara + papelera), la
   * foto entera es el disparador y las acciones salen en una hoja al
   * tocarla. */
  menu?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function selectFile(file?: File) {
    if (!file) return;
    if (
      !(["image/jpeg", "image/png", "image/webp"] as string[]).includes(
        file.type,
      )
    )
      return toast.error("Usa una imagen JPG, PNG o WebP.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("La imagen no puede superar 5 MB.");
    setPendingFile(file);
  }

  async function upload(blob: Blob) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return toast.error("Supabase no está configurado.");
    setLoading(true);
    try {
      const prepare = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: blob.type, sizeBytes: blob.size }),
      });
      const body = (await prepare.json()) as {
        data?: { path: string; token: string };
        error?: { message?: string };
      };
      if (!prepare.ok || !body.data)
        throw new Error(body.error?.message ?? "No se pudo preparar la foto.");
      const supabase = createBrowserClient(url, key);
      const { error } = await supabase.storage
        .from("profile-images")
        .uploadToSignedUrl(body.data.path, body.data.token, blob, {
          contentType: blob.type,
        });
      if (error) throw error;
      const finalize = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: body.data.path }),
      });
      if (!finalize.ok) {
        const finalBody = (await finalize.json()) as {
          error?: { message?: string };
        };
        throw new Error(
          finalBody.error?.message ?? "No se pudo terminar la subida.",
        );
      }
      toast.success("Foto actualizada.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la foto.",
      );
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("remove");
      toast.success("Foto eliminada.");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar la foto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: "relative", width: "fit-content", flex: "0 0 auto" }}
    >
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          if (input.current) input.current.value = "";
        }}
      />
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={(blob) => {
            setPendingFile(null);
            void upload(blob);
          }}
        />
      )}
      {menu ? (
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          trigger={
            <button
              type="button"
              disabled={loading}
              aria-label={`Opciones de ${label.toLowerCase()}`}
              title={`Opciones de ${label.toLowerCase()}`}
              style={{
                padding: 0,
                border: 0,
                background: "transparent",
                display: "block",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {children}
              {loading && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "rgb(0 0 0 / 45%)",
                    borderRadius: "50%",
                  }}
                >
                  <LoaderCircle className="animate-spin" color="white" />
                </span>
              )}
            </button>
          }
        >
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <span className="eyebrow">{label}</span>
            <button
              type="button"
              className="button button-secondary"
              style={{ justifyContent: "flex-start", gap: 10 }}
              onClick={() => {
                setSheetOpen(false);
                input.current?.click();
              }}
            >
              <Camera size={18} />
              {hasImage ? "Cambiar foto" : "Subir foto"}
            </button>
            {hasImage && (
              <button
                type="button"
                className="button button-secondary"
                style={{
                  justifyContent: "flex-start",
                  gap: 10,
                  color: "var(--danger)",
                }}
                onClick={() => {
                  setSheetOpen(false);
                  void remove();
                }}
              >
                <Trash2 size={18} />
                Eliminar foto
              </button>
            )}
          </div>
        </BottomSheet>
      ) : (
        <>
          <button
            type="button"
            disabled={loading}
            aria-label={`${hasImage ? "Cambiar" : "Añadir"} ${label.toLowerCase()}`}
            title={`${hasImage ? "Cambiar" : "Añadir"} ${label.toLowerCase()}`}
            onClick={() => input.current?.click()}
            style={{
              padding: 0,
              border: 0,
              background: "transparent",
              display: "block",
              cursor: "pointer",
            }}
          >
            {children}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#25005a",
                background: "var(--violet)",
                border: "3px solid var(--canvas)",
              }}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={14} />
              ) : (
                <Camera size={14} />
              )}
            </span>
          </button>
          {hasImage && !loading && (
            <button
              type="button"
              aria-label={`Eliminar ${label.toLowerCase()}`}
              title={`Eliminar ${label.toLowerCase()}`}
              onClick={remove}
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                width: 24,
                height: 24,
                padding: 0,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "white",
                background: "var(--coral)",
                border: "2px solid var(--canvas)",
                cursor: "pointer",
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
