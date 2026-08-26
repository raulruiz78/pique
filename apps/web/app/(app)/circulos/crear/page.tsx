"use client";
/* eslint-disable @next/next/no-img-element */
import { Avatar } from "@/components/avatar";
import { ImageCropModal } from "@/components/image-crop-modal";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Camera, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateCirclePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function submit() {
    if (name.trim().length < 2)
      return toast.error("Ponle un nombre de al menos 2 letras.");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      const body = (await response.json()) as {
        data?: { id: string };
        error?: { message?: string };
      };
      if (!response.ok || !body.data)
        throw new Error(body.error?.message ?? "No se pudo crear el círculo.");
      const circleId = body.data.id;
      if (photo) await uploadCirclePhoto(circleId, photo);
      toast.success("Círculo creado.");
      router.push(`/circulos/${circleId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el círculo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="screen-header">
        <Link
          href="/circulos"
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <div>
          <span className="eyebrow">Gente nueva a la que picar</span>
          <h1 className="display" style={{ fontSize: 32, margin: "5px 0 0" }}>
            Monta un círculo
          </h1>
        </div>
      </header>
      <div style={{ display: "grid", gap: 15, marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            type="button"
            aria-label="Añadir foto del círculo"
            onClick={() =>
              document.getElementById("circle-photo-input")?.click()
            }
            style={{
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt=""
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--canvas)",
                }}
              />
            ) : (
              <Avatar name={name || "Círculo"} size={96} accent="var(--lime)" />
            )}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#25005a",
                background: "var(--violet)",
                border: "3px solid var(--canvas)",
              }}
            >
              <Camera size={15} />
            </span>
          </button>
          <input
            id="circle-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <small className="muted">Foto opcional — se ve mejor con una.</small>
        </div>
        <label>
          <span className="field-label">Nombre</span>
          <input
            className="field"
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Los del pique"
          />
        </label>
        <label>
          <span className="field-label">Descripción</span>
          <textarea
            className="field"
            rows={3}
            maxLength={240}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="¿De qué va este grupo?"
          />
        </label>
        <button
          className="button button-primary"
          disabled={loading}
          onClick={submit}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          Crear círculo
        </button>
      </div>
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={(blob) => {
            setPendingFile(null);
            setPhoto(blob);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(blob));
          }}
        />
      )}
    </main>
  );
}

async function uploadCirclePhoto(circleId: string, blob: Blob) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  const endpoint = `/api/v1/circles/${circleId}/image`;
  const prepare = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mimeType: blob.type, sizeBytes: blob.size }),
  });
  const prepareBody = (await prepare.json()) as {
    data?: { path: string; token: string };
  };
  if (!prepare.ok || !prepareBody.data) return;
  const supabase = createBrowserClient(url, key);
  const { error } = await supabase.storage
    .from("profile-images")
    .uploadToSignedUrl(prepareBody.data.path, prepareBody.data.token, blob, {
      contentType: blob.type,
    });
  if (error) return;
  await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: prepareBody.data.path }),
  });
}
