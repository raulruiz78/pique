export function PiqueCoin({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="var(--lime)"
        stroke="#7a9f2e"
        strokeWidth="1.4"
      />
      <circle
        cx="12"
        cy="12"
        r="8.6"
        fill="none"
        stroke="#7a9f2e"
        strokeWidth="1"
        opacity="0.55"
      />
      <text
        x="12"
        y="16.3"
        textAnchor="middle"
        fontFamily="var(--font-space-grotesk), sans-serif"
        fontWeight="800"
        fontSize="12"
        fill="#16131d"
      >
        P
      </text>
    </svg>
  );
}
