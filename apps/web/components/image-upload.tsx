"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function ImageUpload({
  endpoint,
  hasImage,
  label,
}: {
  endpoint: string;
  hasImage: boolean;
  label: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    if (
      !(["image/jpeg", "image/png", "image/webp"] as string[]).includes(
        file.type,
      )
    )
      return toast.error("Usa una imagen JPG, PNG o WebP.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("La imagen no puede superar 5 MB.");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return toast.error("Supabase no está configurado.");
    setLoading(true);
    try {
      const prepare = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
      });
      const body = (await prepare.json()) as {
        data?: { path: string; token: string };
      };
      if (!prepare.ok || !body.data) throw new Error("prepare");
      const supabase = createBrowserClient(url, key);
      const { error } = await supabase.storage
        .from("profile-images")
        .uploadToSignedUrl(body.data.path, body.data.token, file, {
          contentType: file.type,
        });
      if (error) throw error;
      const finalize = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: body.data.path }),
      });
      if (!finalize.ok) throw new Error("finalize");
      toast.success("Foto actualizada.");
      router.refresh();
    } catch {
      toast.error("No se pudo guardar la foto.");
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
    <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <span className="field-label">{label}</span>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <button
          type="button"
          className="button button-secondary"
          disabled={loading}
          onClick={() => input.current?.click()}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" size={18} />
          ) : (
            <Camera size={18} />
          )}
          {hasImage ? "Cambiar foto" : "Añadir foto"}
        </button>
        {hasImage && (
          <button
            type="button"
            className="button button-danger"
            disabled={loading}
            onClick={remove}
          >
            <Trash2 size={18} /> Eliminar
          </button>
        )}
      </div>
      <small className="muted">
        JPG, PNG o WebP · máximo 5 MB · acceso privado.
      </small>
    </div>
  );
}
