"use client";
import { useRef, useState } from "react";

interface SwipeCardProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  leftLabel: string;
  rightLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const THRESHOLD_RATIO = 0.4;
const VELOCITY_THRESHOLD = 0.5; // px/ms
const ROTATION_DIVISOR = 20;
const ROTATION_CLAMP = 12;
const EXIT_DISTANCE_RATIO = 1.2;
const EXIT_DELAY_MS = 120; // --duration-fast

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Card arrastrable en un eje (docs/features/motion-system.md, 0.8.9.2).
// El swipe es siempre un atajo sobre acciones ya accesibles por botón —
// `leftLabel`/`rightLabel` solo alimentan el indicador visual, los
// controles reales viven en `children`.
export function SwipeCard({
  onSwipeLeft,
  onSwipeRight,
  leftLabel,
  rightLabel,
  children,
  disabled = false,
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startTime: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || exiting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startTime: e.timeStamp };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    setDx(e.clientX - dragState.current.startX);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    dragState.current = null;
    setDragging(false);
    if (!state) return;
    const width = cardRef.current?.offsetWidth ?? 320;
    const elapsed = Math.max(1, e.timeStamp - state.startTime);
    const distance = e.clientX - state.startX;
    const velocity = Math.abs(distance) / elapsed;
    const committed =
      Math.abs(distance) > width * THRESHOLD_RATIO ||
      velocity > VELOCITY_THRESHOLD;
    if (!committed) {
      setDx(0);
      return;
    }
    const direction = distance > 0 ? "right" : "left";
    if (prefersReducedMotion()) {
      setDx(0);
      if (direction === "right") onSwipeRight();
      else onSwipeLeft();
      return;
    }
    setExiting(direction);
    setDx(
      direction === "right"
        ? width * EXIT_DISTANCE_RATIO
        : -width * EXIT_DISTANCE_RATIO,
    );
    window.setTimeout(() => {
      if (direction === "right") onSwipeRight();
      else onSwipeLeft();
    }, EXIT_DELAY_MS);
  }

  const rotation = Math.max(
    -ROTATION_CLAMP,
    Math.min(ROTATION_CLAMP, dx / ROTATION_DIVISOR),
  );
  const actionOpacity = Math.min(1, Math.abs(dx) / 80);

  return (
    <div style={{ position: "relative" }}>
      {!disabled && (
        <>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              zIndex: 1,
              fontWeight: 800,
              color: "var(--danger)",
              opacity: dx < 0 ? actionOpacity : 0,
            }}
          >
            ✕ {leftLabel}
          </span>
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: 18,
              top: 18,
              zIndex: 1,
              fontWeight: 800,
              color: "var(--success)",
              opacity: dx > 0 ? actionOpacity : 0,
            }}
          >
            ✓ {rightLabel}
          </span>
        </>
      )}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          touchAction: "pan-y",
          transform: `translateX(${dx}px) rotate(${rotation}deg)`,
          opacity: exiting ? 0 : 1,
          transition: dragging
            ? "none"
            : `transform var(--duration-${exiting ? "fast" : "normal"}) var(--ease-${exiting ? "out" : "spring"}), opacity var(--duration-fast) var(--ease-out)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
