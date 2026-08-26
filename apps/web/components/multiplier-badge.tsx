import { Flame } from "lucide-react";

export function multiplierFor(streakDays: number): number {
  return Math.min(2, 1 + 0.05 * Math.max(0, streakDays));
}

export function MultiplierBadge({
  enabled,
  streakDays,
}: {
  enabled: boolean;
  streakDays: number;
}) {
  if (!enabled) return null;
  return (
    <span
      className="pill pill-lime motion-pop"
      title={
        streakDays === 0
          ? "Arranca la racha y sube el multiplicador"
          : `${streakDays} ${streakDays === 1 ? "día" : "días"} de racha — no la sueltes`
      }
    >
      <Flame size={12} />x{multiplierFor(streakDays).toFixed(2)}
    </span>
  );
}
