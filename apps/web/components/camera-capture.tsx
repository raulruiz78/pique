"use client";
import {
  Check,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  RotateCw,
  SwitchCamera,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_DIMENSION = 1600;
type Rotation = 0 | 90 | 180 | 270;
type Facing = "environment" | "user";

// Reencuadra/rota y limita el tamaño de una imagen ya capturada o elegida
// de galería. Un único paso por canvas para ambos casos: si rotation es 0
// solo recorta a MAX_DIMENSION, si no, además rota — nunca voltea (eso es
// el trabajo de la vista previa en vivo, no de la imagen final).
function finalizeImage(blob: Blob, rotation: Rotation): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const sourceUrl = URL.createObjectURL(blob);
    image.onload = () => {
      const swapped = rotation === 90 || rotation === 270;
      const outWidth = swapped ? image.naturalHeight : image.naturalWidth;
      const outHeight = swapped ? image.naturalWidth : image.naturalHeight;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(outWidth, outHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(outWidth * scale);
      canvas.height = Math.round(outHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("no-canvas-context"));
        return;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        (-image.naturalWidth * scale) / 2,
        (-image.naturalHeight * scale) / 2,
        image.naturalWidth * scale,
        image.naturalHeight * scale,
      );
      URL.revokeObjectURL(sourceUrl);
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("blob-failed")),
        "image/jpeg",
        0.9,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("image-load-failed"));
    };
    image.src = sourceUrl;
  });
}

// Cámara propia dentro de la app (docs/features/motion-system.md no cubre
// esto — es funcionalidad, no motion — pedido explícitamente para que la
// foto de evidencia no salga en modo espejo). Patrón tipo Instagram: la
// vista previa de la cámara frontal se voltea con CSS para que se sienta
// como mirarse en un espejo, pero el frame capturado nunca se voltea — el
// resultado guardado es siempre el que vería alguien delante de ti, no al
// revés. Si getUserMedia falla o no está disponible, se ofrece elegir de
// galería como alternativa siempre visible, nunca un callejón sin salida.
export function CameraCapture({
  onConfirm,
  onCancel,
}: {
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capturedBlobRef = useRef<Blob | null>(null);

  const [facing, setFacing] = useState<Facing>("environment");
  const [starting, setStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [saving, setSaving] = useState(false);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (capturedUrl) return;
    let cancelled = false;
    async function start() {
      requestAnimationFrame(() => {
        if (!cancelled) {
          setStarting(true);
          setCameraError(null);
        }
      });
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraError("Este navegador no permite usar la cámara aquí.");
          setStarting(false);
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
      } catch {
        if (!cancelled) {
          setCameraError(
            "No se pudo acceder a la cámara. Puedes elegir una foto de la galería.",
          );
          setStarting(false);
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, capturedUrl]);

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // En bastantes móviles (sobre todo cámara frontal, sujetando el
    // teléfono en vertical) el buffer de vídeo llega en horizontal
    // (videoWidth > videoHeight) aunque la vista previa se vea perfectamente
    // vertical en pantalla — el navegador aplica una rotación solo para
    // mostrarla, que drawImage() no hereda. Capturar tal cual en ese caso
    // saca la foto girada 90°. Si detectamos ese desajuste, compensamos
    // rotando nosotros mismos al dibujar en el canvas.
    const bufferIsLandscape = video.videoWidth > video.videoHeight;
    const displayIsPortrait = video.clientWidth < video.clientHeight;
    const needsRotation = bufferIsLandscape && displayIsPortrait;
    if (needsRotation) {
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2);
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Frame tal cual, sin voltear — ver comentario del componente.
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    stopStream();
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedBlobRef.current = blob;
        setRotation(0);
        setCapturedUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92,
    );
  }

  function pickFromGallery(fileList: FileList | null) {
    const picked = fileList?.[0];
    if (!picked) return;
    stopStream();
    capturedBlobRef.current = picked;
    setRotation(0);
    setCapturedUrl(URL.createObjectURL(picked));
  }

  function retake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    capturedBlobRef.current = null;
    setRotation(0);
    setCapturedUrl(null);
  }

  async function confirm() {
    const blob = capturedBlobRef.current;
    if (!blob) return;
    setSaving(true);
    try {
      const finalBlob = await finalizeImage(blob, rotation);
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      onConfirm(finalBlob);
    } finally {
      setSaving(false);
    }
  }

  function close() {
    stopStream();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    onCancel();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
        }}
      >
        <button
          type="button"
          aria-label="Cerrar"
          className="button button-secondary"
          style={{ width: 44, padding: 0 }}
          onClick={close}
        >
          <X />
        </button>
        <span style={{ color: "white", fontWeight: 700 }}>
          {capturedUrl ? "Revisa tu foto" : "Haz la foto"}
        </span>
        <span style={{ width: 44 }} />
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {capturedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedUrl}
            alt="Foto capturada"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `rotate(${rotation}deg)`,
              transition: "transform var(--duration-normal) var(--ease-out)",
            }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // Espejo solo visual, solo cámara frontal — nunca se aplica
                // al frame capturado (ver capture()).
                transform: facing === "user" ? "scaleX(-1)" : "none",
              }}
            />
            {starting && !cameraError && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                }}
              >
                <LoaderCircle className="animate-spin" />
              </div>
            )}
            {cameraError && (
              <div
                className="stitch-card motion-fade-in"
                style={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <p className="muted" style={{ margin: "0 0 14px" }}>
                  {cameraError}
                </p>
                <button
                  type="button"
                  className="button button-primary"
                  style={{ width: "100%" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} /> Elegir de galería
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          pickFromGallery(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        style={{
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: 12,
        }}
      >
        {capturedUrl ? (
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={retake}
            >
              <RefreshCw size={18} /> Repetir
            </button>
            <button
              type="button"
              aria-label="Girar foto"
              className="button button-secondary"
              style={{ width: 54, padding: 0 }}
              onClick={() =>
                setRotation((current) => ((current + 90) % 360) as Rotation)
              }
            >
              <RotateCw size={18} />
            </button>
            <button
              type="button"
              className="button button-lime"
              disabled={saving}
              onClick={confirm}
            >
              {saving ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Check size={18} />
              )}{" "}
              Usar foto
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              aria-label="Elegir de galería"
              className="button button-secondary"
              style={{ width: 54, padding: 0 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              aria-label="Capturar foto"
              onClick={capture}
              disabled={starting || Boolean(cameraError)}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "4px solid white",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                opacity: starting || cameraError ? 0.4 : 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "white",
                }}
              />
            </button>
            <button
              type="button"
              aria-label="Cambiar de cámara"
              className="button button-secondary"
              style={{ width: 54, padding: 0 }}
              disabled={starting}
              onClick={() =>
                setFacing((current) =>
                  current === "environment" ? "user" : "environment",
                )
              }
            >
              <SwitchCamera size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
