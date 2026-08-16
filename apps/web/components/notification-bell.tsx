"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const BOUNCE_MS = 260;

// Campana con bote al detectar notificaciones nuevas (docs/features/motion-system.md,
// 0.8.9.5). Igual que LevelProgress/RankingList: esta página no tiene datos
// en vivo, así que "nuevo" se calcula comparando con el último recuento
// visto por este navegador (localStorage), no con un push en tiempo real.
export function NotificationBell({
  userId,
  unreadCount,
}: {
  userId?: string | undefined;
  unreadCount: number;
}) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `pique-unread-${userId}`;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const raw = localStorage.getItem(storageKey);
    localStorage.setItem(storageKey, String(unreadCount));
    if (reducedMotion || raw === null) return;
    const prevCount = Number(raw);
    if (Number.isFinite(prevCount) && unreadCount > prevCount)
      requestAnimationFrame(() => setBounce(true));
  }, [userId, unreadCount]);

  useEffect(() => {
    if (!bounce) return;
    const timer = setTimeout(() => setBounce(false), BOUNCE_MS);
    return () => clearTimeout(timer);
  }, [bounce]);

  return (
    <Link
      aria-label="Notificaciones"
      href={"/notificaciones" as "/hoy"}
      className="button button-secondary"
      style={{ width: 48, padding: 0, position: "relative" }}
    >
      <Bell
        size={20}
        className={bounce ? "notification-bell-ring" : undefined}
      />
      {unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} notificaciones sin leer`}
          className={bounce ? "motion-pop" : undefined}
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 20,
            height: 20,
            padding: "0 5px",
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "var(--coral)",
            color: "white",
            border: "2px solid var(--canvas)",
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
