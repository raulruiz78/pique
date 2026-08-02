export function Avatar({
  name,
  size = 42,
  accent = "var(--violet)",
}: {
  name: string;
  size?: number;
  accent?: string;
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
        borderRadius: "38%",
        background: accent,
        color: accent === "var(--lime)" ? "#16131d" : "white",
        fontSize: size * 0.32,
        fontWeight: 950,
      }}
    >
      {initials}
    </span>
  );
}
