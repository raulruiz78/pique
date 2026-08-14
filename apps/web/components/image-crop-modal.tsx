"use client";
import { Check, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VIEW = 280;
const OUTPUT = 512;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [natural, setNatural] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setObjectUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  const baseScale = natural
    ? Math.max(VIEW / natural.width, VIEW / natural.height)
    : 1;
  const scale = baseScale * zoom;

  function clampOffset(x: number, y: number, currentScale: number) {
    if (!natural) return { x, y };
    const width = natural.width * currentScale;
    const height = natural.height * currentScale;
    return {
      x: clamp(x, VIEW - width, 0),
      y: clamp(y, VIEW - height, 0),
    };
  }

  function handleLoad() {
    const image = imageRef.current;
    if (!image) return;
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    setNatural({ width, height });
    const initialScale = Math.max(VIEW / width, VIEW / height);
    setOffset(
      clampOffset(
        (VIEW - width * initialScale) / 2,
        (VIEW - height * initialScale) / 2,
        initialScale,
      ),
    );
  }

  function handleZoom(nextZoom: number) {
    if (!natural) return;
    const nextScale = baseScale * nextZoom;
    const centerX = (VIEW / 2 - offset.x) / scale;
    const centerY = (VIEW / 2 - offset.y) / scale;
    setZoom(nextZoom);
    setOffset(
      clampOffset(
        VIEW / 2 - centerX * nextScale,
        VIEW / 2 - centerY * nextScale,
        nextScale,
      ),
    );
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(
      clampOffset(
        drag.offsetX + (event.clientX - drag.startX),
        drag.offsetY + (event.clientY - drag.startY),
        scale,
      ),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function confirm() {
    if (!natural) return;
    setSaving(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSaving(false);
      return;
    }
    const sourceX = -offset.x / scale;
    const sourceY = -offset.y / scale;
    const sourceSize = VIEW / scale;
    const image = imageRef.current!;
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT,
      OUTPUT,
    );
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgb(0 0 0 / 72%)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        className="stitch-card"
        style={{
          padding: 22,
          width: "min(360px, 100%)",
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <b style={{ fontSize: 18, display: "block" }}>Encuadra tu foto</b>
          <small className="muted">Arrastra y haz zoom para centrarla.</small>
        </div>
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: VIEW,
            height: VIEW,
            marginInline: "auto",
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            background: "#0b0b0b",
            touchAction: "none",
            cursor: "grab",
            border: "2px solid var(--violet)",
          }}
        >
          {objectUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imageRef}
              src={objectUrl}
              alt=""
              onLoad={handleLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: natural ? natural.width * scale : undefined,
                height: natural ? natural.height * scale : undefined,
                maxWidth: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ZoomIn size={18} color="var(--muted)" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => handleZoom(Number(event.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button-secondary"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            <X size={18} /> Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            style={{ flex: 1 }}
            disabled={!natural || saving}
            onClick={confirm}
          >
            <Check size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
