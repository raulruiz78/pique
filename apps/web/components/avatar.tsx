import Image from "next/image";

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
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
