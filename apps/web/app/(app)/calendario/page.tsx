import { EmptyState } from "@/components/empty-state";
import { calendarQuery } from "@/lib/queries";
import { CalendarDays, Check, Clock3 } from "lucide-react";

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export default async function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  weekStart.setDate(today.getDate() - daysSinceMonday);
  const to = new Date(today);
  to.setDate(to.getDate() + 30);
  const rawItems = (await calendarQuery(today, to)) as unknown as Array<{
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
    challenges: { title?: string };
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
  const week = Array.from({ length: 7 }, (_, index) => {
    const value = new Date(weekStart);
    value.setDate(value.getDate() + index);
    return value;
  });
  return (
    <main className="page">
      <header>
        <span className="eyebrow">Tu ritmo</span>
        <h1 className="display" style={{ fontSize: 44, margin: "6px 0 8px" }}>
          Calendario
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Lo que hiciste y lo que viene. Sin sorpresas.
        </p>
      </header>
      <section
        className="card"
        style={{
          margin: "26px 0",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 5,
        }}
      >
        {week.map((day) => {
          const today = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: 67,
                borderRadius: 15,
                padding: "10px 3px",
                textAlign: "center",
                background: today ? "var(--violet)" : "transparent",
                color: today ? "white" : "var(--ink)",
              }}
            >
              <small style={{ display: "block", opacity: 0.65 }}>
                {DAYS[day.getDay()]}
              </small>
              <strong style={{ display: "block", fontSize: 19, marginTop: 5 }}>
                {day.getDate()}
              </strong>
              {items.some(
                (item) =>
                  new Date(item.starts_at).toDateString() ===
                  day.toDateString(),
              ) && (
                <i
                  style={{
                    display: "block",
                    width: 5,
                    height: 5,
                    borderRadius: 5,
                    background: today ? "var(--lime)" : "var(--violet)",
                    margin: "5px auto",
                  }}
                />
              )}
            </div>
          );
        })}
      </section>
      <h2 style={{ marginBottom: 12 }}>Próximos 30 días</h2>
      {items.length === 0 ? (
        <EmptyState
          title="Calendario despejado"
          text="Las ocurrencias aparecerán cuando tus retos estén aceptados."
          href="/crear"
          action="Crear reto"
        />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => {
            const date = new Date(item.starts_at);
            const done = item.done;
            return (
              <article
                key={item.id}
                className="card"
                style={{
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ width: 48, textAlign: "center" }}>
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
