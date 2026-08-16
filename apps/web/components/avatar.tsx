"use client";
import Image from "next/image";
import { useState } from "react";

export function Avatar({
  name,
  size = 42,
  accent = "var(--violet)",
  src,
}: {
  name: string;
  size?: number;
  accent?: string;
  src?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(src);
  // Si src cambia (p. ej. tras subir una foto nueva), dar a la imagen
  // nueva una oportunidad real en vez de quedarse en el fallback de la
  // anterior. Ajuste durante el render (no en un efecto): es el patrón
  // recomendado por React para "resetear estado cuando cambia una prop".
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      role="img"
      aria-label={`Avatar de ${name}`}
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: accent,
        color: accent === "var(--lime)" ? "#16131d" : "white",
        fontSize: size * 0.32,
        fontWeight: 950,
        overflow: "hidden",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 0 2px var(--canvas)`,
      }}
    >
      {src && !failed ? (
        // unoptimized a propósito (auditoría 0.8.6): src es una ruta propia
        // autenticada (/api/v1/media/...), no un asset público. El
        // optimizador de imágenes de Next hace su propio fetch interno
        // servidor-a-servidor para generar las variantes, y ese fetch no
        // reenvía las cookies de sesión del navegador — con optimización
        // activada, cada avatar fallaría la comprobación de auth de la ruta
        // y no cargaría ninguna imagen.
        //
        // onError → iniciales: la ruta puede fallar por motivos legítimos
        // ajenos al usuario que la ve (avatar_path apunta a un objeto que
        // ya no existe en Storage, red, etc.) — sin esto, un fallo se ve
        // como el icono roto del navegador en vez de degradar con
        // elegancia al mismo estado que "sin foto".
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
