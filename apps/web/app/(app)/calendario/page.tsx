import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/avatar";
import { CategoryBadge } from "@/components/challenge-category";
import { InteractiveMonth } from "@/components/interactive-month";
import {
  calendarQuery,
  profileSummaryQuery,
  weeklySummaryQuery,
} from "@/lib/queries";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Trophy,
} from "lucide-react";

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export default async function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const queryStart = new Date(monthStart);
  const to = new Date(today);
  to.setDate(to.getDate() + 30);
  if (monthEnd > to) to.setTime(monthEnd.getTime());
  const [calendarData, summary, weeklySummary] = await Promise.all([
    calendarQuery(queryStart, to),
    profileSummaryQuery(),
    weeklySummaryQuery(),
  ]);
  const rawItems = calendarData as unknown as Array<{
    id: string;
    starts_at: string;
    closes_at: string;
    status: string;
    goals: {
      id?: string;
      name?: string;
      recurrence?: string;
      base_points?: number;
    };
    challenges: { title?: string; category?: string };
  }>;
  const grouped = new Map<
    string,
    { items: typeof rawItems; multiple: boolean }
  >();
  for (const item of rawItems) {
    const recurrence = item.goals?.recurrence ?? "";
    const flexible = recurrence.includes("FLEX=");
    const dailyMultiple = recurrence.includes("DAILYCOUNT=");
    const multiple = flexible || dailyMultiple;
    const period = flexible ? item.closes_at : item.starts_at.slice(0, 10);
    const key = multiple ? `${item.goals?.id}-${period}` : item.id;
    const group = grouped.get(key) ?? { items: [], multiple };
    group.items.push(item);
    grouped.set(key, group);
  }
  const items = [...grouped.values()].map(({ items, multiple }) => ({
    ...items[0]!,
    multiple,
    completed: items.filter((item) => item.status !== "PENDING").length,
    total: items.length,
    done: items.every((item) => item.status === "APPROVED"),
  }));
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const monthDays = Array.from({ length: 42 }, (_, index) => {
    const value = new Date(gridStart);
    value.setDate(value.getDate() + index);
    return value;
  });
  const dateKey = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const doneDates = new Set(
    items
      .filter((item) => item.done)
      .map((item) => dateKey(new Date(item.starts_at))),
  );
  const profile = summary?.profile as {
    display_name?: string;
    avatar_path?: string | null;
    total_points?: number;
    current_streak?: number;
  } | null;
  const upcomingItems = items
    .filter((item) => new Date(item.starts_at) >= today)
    .slice(0, 12);
  const level = Math.floor((profile?.total_points ?? 0) / 500) + 1;
  return (
    <main className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar
          name={profile?.display_name ?? "Pique"}
          size={48}
          src={
            profile?.avatar_path && summary?.user?.id
              ? `/api/v1/media/profiles/${summary.user.id}`
              : null
          }
        />
        <h1
          className="display"
          style={{ color: "var(--violet)", fontSize: 26, margin: 0, flex: 1 }}
        >
          Hoy toca dar la talla.
        </h1>
      </header>
      <section style={{ marginTop: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span className="field-label muted">Tu racha actual</span>
            <strong
              className="display"
              style={{ color: "var(--lime)", fontSize: 38 }}
            >
              <Flame
                size={28}
                style={{ display: "inline", verticalAlign: -4 }}
              />{" "}
              {profile?.current_streak ?? 0} días
            </strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="field-label muted">Nivel</span>
            <strong style={{ fontSize: 22 }}>NIVEL {level}</strong>
          </div>
        </div>
        <div className="wizard-progress-track" style={{ marginTop: 16 }}>
          <div
            className="wizard-progress-fill"
            style={{
              width: `${((profile?.total_points ?? 0) % 500) / 5}%`,
              background: "var(--lime)",
            }}
          />
        </div>
      </section>
      {weeklySummary && (
        <section
          className="stitch-card"
          style={{
            marginTop: 24,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              flex: "0 0 auto",
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "rgb(210 187 255 / 12%)",
            }}
          >
            <Trophy color="var(--violet)" size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <span className="field-label muted">Tu semana</span>
            <p style={{ margin: "4px 0 0" }}>
              <b>{weeklySummary.weekPoints}</b> puntos ·{" "}
              <b>{weeklySummary.weekCheckIns}</b>{" "}
              {weeklySummary.weekCheckIns === 1
                ? "check-in validado"
                : "check-ins validados"}
            </p>
          </div>
        </section>
      )}
      <section
        className="stitch-card"
        style={{ margin: "28px 0 36px", padding: "24px 18px 28px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 26,
          }}
        >
          <h2 style={{ margin: 0, textTransform: "capitalize" }}>
            {today.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button button-secondary"
              disabled
              aria-label="Mes anterior"
              style={{ width: 44, minHeight: 44, padding: 0 }}
            >
              <ChevronLeft />
            </button>
            <button
              className="button button-secondary"
              disabled
              aria-label="Mes siguiente"
              style={{ width: 44, minHeight: 44, padding: 0 }}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="month-grid" style={{ marginBottom: 12 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((label) => (
            <b key={label} className="muted" style={{ fontSize: 12 }}>
              {label}
            </b>
          ))}
        </div>
        <InteractiveMonth
          days={monthDays.map((day) => {
            const key = dateKey(day);
            return {
              key,
              day: day.getDate(),
              outside: day.getMonth() !== today.getMonth(),
              today: day.toDateString() === today.toDateString(),
              done: doneDates.has(key),
              events: items
                .filter((item) => dateKey(new Date(item.starts_at)) === key)
                .map((item) => ({
                  name: item.goals?.name ?? "Reto",
                  challenge: item.challenges?.title ?? "Pique",
                  points: item.goals?.base_points ?? 0,
                })),
            };
          })}
          userId={summary?.user?.id}
        />
      </section>
      <h2 style={{ marginBottom: 12 }}>Próximos 30 días</h2>
      {upcomingItems.length === 0 ? (
        <EmptyState
          title="Calendario despejado"
          text="Las ocurrencias aparecerán cuando tus retos estén aceptados."
          href="/crear"
          action="Crear reto"
        />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {upcomingItems.map((item) => {
            const date = new Date(item.starts_at);
            const done = item.done;
            return (
              <article
                key={item.id}
                className="stitch-card"
                style={{
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 62,
                    padding: "10px 4px",
                    borderRadius: 16,
                    textAlign: "center",
                    background:
                      date.toDateString() === today.toDateString()
                        ? "var(--violet-deep)"
                        : "var(--surface-high)",
                  }}
                >
                  <b style={{ display: "block", fontSize: 20 }}>
                    {date.getDate()}
                  </b>
                  <small className="muted">{DAYS[date.getDay()]}</small>
                </div>
                <div
                  style={{
                    width: 3,
                    height: 40,
                    background: done ? "var(--success)" : "var(--violet)",
                    borderRadius: 4,
                  }}
                />
                <CategoryBadge category={item.challenges?.category} size={44} />
                <div style={{ flex: 1 }}>
                  <b>{item.goals?.name}</b>
                  <small
                    className="muted"
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {item.challenges?.title} · {item.goals?.base_points} pt
                    {item.multiple &&
                      ` · ${item.completed} de ${item.total} completados`}
                  </small>
                </div>
                {done ? (
                  <Check color="var(--success)" />
                ) : (
                  <Clock3 size={19} color="var(--warning)" />
                )}
              </article>
            );
          })}
        </div>
      )}
      <div
        className="card"
        style={{ padding: 18, marginTop: 22, display: "flex", gap: 12 }}
      >
        <CalendarDays color="var(--violet)" />
        <p
          className="muted"
          style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}
        >
          Las fechas se muestran en tu zona horaria. La hora del servidor decide
          si un check-in está dentro de plazo.
        </p>
      </div>
    </main>
  );
}
