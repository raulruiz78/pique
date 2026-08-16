"use client";
import { CalendarCheck2 } from "lucide-react";
import { useEffect, useState } from "react";

export type CalendarCell = {
  key: string;
  day: number;
  outside: boolean;
  today: boolean;
  done: boolean;
  events: Array<{ name: string; challenge: string; points: number }>;
};
export function InteractiveMonth({
  days,
  userId,
}: {
  days: CalendarCell[];
  userId?: string | undefined;
}) {
  const [selected, setSelected] = useState(
    days.find((day) => day.today)?.key ?? days[0]?.key ?? "",
  );
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());
  const current = days.find((day) => day.key === selected);

  // Igual que LevelProgress/RankingList/NotificationBell: esta página no
  // tiene datos en vivo, así que "recién completado" se calcula comparando
  // contra el último estado visto por este navegador (docs/features/motion-system.md,
  // 0.8.9.6).
  useEffect(() => {
    if (!userId) return;
    const storageKey = `pique-calendar-done-${userId}`;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const raw = localStorage.getItem(storageKey);
    const doneKeys = days.filter((day) => day.done).map((day) => day.key);
    localStorage.setItem(storageKey, JSON.stringify(doneKeys));
    if (reducedMotion || !raw) return;
    const prevDone = new Set<string>(JSON.parse(raw) as string[]);
    const fresh = doneKeys.filter((key) => !prevDone.has(key));
    if (fresh.length)
      requestAnimationFrame(() => setJustCompleted(new Set(fresh)));
  }, [userId, days]);

  return (
    <>
      <div className="month-grid">
        {days.map((day) => (
          <button
            key={day.key}
            type="button"
            className={
              justCompleted.has(day.key) ? "month-day motion-pop" : "month-day"
            }
            aria-label={`Día ${day.day}, ${day.events.length} retos`}
            aria-pressed={selected === day.key}
            data-selected={selected === day.key}
            data-today={day.today}
            data-done={day.done}
            data-event={day.events.length > 0 && !day.done}
            onClick={() => setSelected(day.key)}
            style={{
              opacity: day.outside ? 0.25 : 1,
              border: 0,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {day.day}
          </button>
        ))}
      </div>
      <div className="selected-day-panel">
        <span className="field-label">Retos del día {current?.day}</span>
        {!current?.events.length ? (
          <small className="muted">No tienes retos programados este día.</small>
        ) : (
          current.events.map((event, index) => (
            <div
              key={`${event.name}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: index ? "1px solid var(--line)" : 0,
              }}
            >
              <CalendarCheck2 color="var(--violet)" />
              <span style={{ flex: 1 }}>
                <b>{event.name}</b>
                <small className="muted" style={{ display: "block" }}>
                  {event.challenge}
                </small>
              </span>
              <strong>{event.points} pt</strong>
            </div>
          ))
        )}
      </div>
    </>
  );
}
