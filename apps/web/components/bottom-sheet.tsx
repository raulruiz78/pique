"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";

const CLOSE_THRESHOLD_RATIO = 0.3;
const VELOCITY_THRESHOLD = 0.5; // px/ms

// Bottom sheet reutilizable sobre Radix Dialog (docs/features/motion-system.md,
// 0.8.9.4): mantiene el focus trap / Esc / aria de Radix, solo cambia cómo
// entra el contenido (desde abajo, arrastrable para cerrar) en vez de un
// modal centrado.
export function BottomSheet({
  open,
  onOpenChange,
  trigger,
  ariaDescribedBy,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  ariaDescribedBy?: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; startTime: number } | null>(null);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, startTime: e.timeStamp };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    setDy(Math.max(0, e.clientY - dragState.current.startY));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    dragState.current = null;
    setDragging(false);
    if (!state) return;
    const height = sheetRef.current?.offsetHeight ?? 400;
    const elapsed = Math.max(1, e.timeStamp - state.startTime);
    const distance = e.clientY - state.startY;
    const velocity = distance / elapsed;
    if (
      distance > height * CLOSE_THRESHOLD_RATIO ||
      velocity > VELOCITY_THRESHOLD
    ) {
      onOpenChange(false);
    }
    setDy(0);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bottom-sheet-overlay" />
        <Dialog.Content
          aria-describedby={ariaDescribedBy}
          ref={sheetRef}
          className="stitch-card bottom-sheet-content"
          style={{
            transform: `translate(-50%, ${dy}px)`,
            transition: dragging
              ? "none"
              : `transform var(--duration-normal) var(--ease-spring)`,
          }}
        >
          <div
            className="bottom-sheet-handle"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
