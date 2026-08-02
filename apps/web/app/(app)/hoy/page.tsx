import { Avatar } from "@/components/avatar";
import { CheckInButton } from "@/components/check-in-button";
import { EmptyState } from "@/components/empty-state";
import { ReviewButtons } from "@/components/review-button";
import { dashboardQuery } from "@/lib/queries";
import {
  Bell,
  ChevronRight,
  Clock3,
  Flame,
  Medal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Relation {
  id?: string;
  name?: string;
  recurrence?: string;
  base_points?: number;
  evidence_required?: boolean;
  title?: string;
}
export default async function TodayPage() {
  const data = await dashboardQuery();
  const profile = data?.profile as {
    display_name?: string;
    total_points?: number;
    current_streak?: number;
  } | null;
  const occurrences = (data?.occurrences ?? []) as unknown as Array<{
    id: string;
    status: string;
    starts_at: string;
    closes_at: string;
    goals: Relation | Relation[];
    challenges: Relation | Relation[];
  }>;
  const groupedOccurrences = new Map<
    string,
    { items: typeof occurrences; multiple: boolean }
  >();
  for (const occurrence of occurrences) {
    const goal = Array.isArray(occurrence.goals)
      ? occurrence.goals[0]
      : occurrence.goals;
    const recurrence = goal?.recurrence ?? "";
    const multiple =
      recurrence.includes("FLEX=") || recurrence.includes("DAILYCOUNT=");
    const period = recurrence.includes("FLEX=")
      ? occurrence.closes_at
      : occurrence.starts_at.slice(0, 10);
    const key = multiple ? `${goal?.id}-${period}` : occurrence.id;
    const group = groupedOccurrences.get(key) ?? { items: [], multiple };
    group.items.push(occurrence);
    groupedOccurrences.set(key, group);
  }
  const objectiveCards = [...groupedOccurrences.values()];
  const participants = (data?.participants ?? []) as unknown as Array<{
    user_id: string;
    score: number;
    profiles: { display_name?: string } | Array<{ display_name?: string }>;
  }>;
  const reviews = (data?.reviews ?? []) as unknown as Array<{
    id: string;
    note: string | null;
    profiles: { display_name?: string };
    challenges: { title?: string };
    evidenceUrl: string | null;
  }>;
  const activities = (data?.activities ?? []) as unknown as Array<{
    id: string;
    type: string;
    payload: Record<string, string | number>;
    created_at: string;
  }>;
  const displayName = profile?.display_name ?? "jugador";
  return (
    <main className="page">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div>
          <span className="muted" style={{ fontSize: 14 }}>
            Buenos días, {displayName}
          </span>
          <h1 className="display" style={{ fontSize: 39, margin: "4px 0 0" }}>
            Hoy toca dar la talla.
          </h1>
        </div>
        <Link
          aria-label="Notificaciones"
          href={"/notificaciones" as "/hoy"}
          className="button button-secondary"
          style={{ width: 48, padding: 0 }}
        >
          <Bell size={20} />
        </Link>
      </header>
      <section
        aria-label="Resumen"
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 11,
          marginBottom: 24,
        }}
      >
        <div
          className="card"
          style={{ padding: 18, background: "var(--violet)", color: "white" }}
        >
          <span style={{ fontSize: 12, opacity: 0.75 }}>PUNTOS TOTALES</span>
          <strong
            className="display"
            style={{ display: "block", fontSize: 39, marginTop: 5 }}
          >
            {profile?.total_points ?? 0}
          </strong>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <Flame color="var(--coral)" size={20} />
          <strong style={{ display: "block", fontSize: 21, marginTop: 7 }}>
            {profile?.current_streak ?? 0} días
          </strong>
          <span className="muted" style={{ fontSize: 12 }}>
            de racha
          </span>
        </div>
      </section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          margin: "30px 2px 12px",
        }}
      >
        <div>
          <span className="eyebrow">En juego</span>
          <h2 style={{ margin: "4px 0 0" }}>Tus objetivos de hoy</h2>
        </div>
        <Link href="/calendario" aria-label="Ver calendario">
          <ChevronRight />
        </Link>
      </div>
      {objectiveCards.length === 0 ? (
        <EmptyState
          title={data ? "Hoy tienes vía libre" : "Conecta tu base de datos"}
          text={
            data
              ? "No hay objetivos para hoy. Puedes preparar el próximo reto."
              : "No se ha podido conectar con el servicio. Inténtalo de nuevo en unos minutos."
          }
          href="/crear"
          action="Crear un reto"
        />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {objectiveCards.map(({ items, multiple }) => {
            const occurrence =
              items.find((item) => item.status === "PENDING") ?? items[0]!;
            const goal = Array.isArray(occurrence.goals)
              ? occurrence.goals[0]
              : occurrence.goals;
            const challenge = Array.isArray(occurrence.challenges)
              ? occurrence.challenges[0]
              : occurrence.challenges;
            const completed = items.filter(
              (item) => item.status !== "PENDING",
            ).length;
            const done = completed === items.length;
            return (
              <article
                className="card"
                key={`${occurrence.id}-${items.length}`}
                style={{
                  overflow: "hidden",
                  borderLeft: `5px solid ${done ? "var(--success)" : "var(--violet)"}`,
                }}
              >
                <div
                  style={{
                    padding: 19,
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span
                      className={`pill ${done ? "pill-lime" : "pill-violet"}`}
                    >
                      {done ? (
                        "LISTO"
                      ) : (
                        <>
                          <Clock3 size={12} /> HOY · {goal?.base_points ?? 0} PT
                        </>
                      )}
                    </span>
                    <h3 style={{ fontSize: 21, margin: "12px 0 3px" }}>
                      {goal?.name}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                      {challenge?.title}
                      {multiple &&
                        ` · ${completed} de ${items.length} completados`}
                    </p>
                  </div>
                  {!done && (
                    <CheckInButton
                      occurrenceId={occurrence.id}
                      evidenceRequired={Boolean(goal?.evidence_required)}
                      title={goal?.name ?? "Objetivo"}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {reviews.length > 0 && (
        <section>
          <div style={{ margin: "30px 2px 12px" }}>
            <span className="eyebrow">Te toca decidir</span>
            <h2 style={{ margin: "4px 0 0" }}>Pendiente de tu visto bueno</h2>
          </div>
          {reviews.map((review) => (
            <article key={review.id} className="card" style={{ padding: 18 }}>
              {review.evidenceUrl && (
                <Image
                  src={review.evidenceUrl}
                  alt={`Evidencia enviada por ${review.profiles?.display_name ?? "el participante"}`}
                  width={460}
                  height={260}
                  unoptimized
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 17,
                    marginBottom: 15,
                  }}
                />
              )}
              <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                <Avatar
                  name={review.profiles?.display_name ?? "Rival"}
                  accent="var(--coral)"
                />
                <div style={{ flex: 1 }}>
                  <b>
                    {review.profiles?.display_name ?? "Tu rival"} ha enviado
                    prueba
                  </b>
                  <p
                    className="muted"
                    style={{ margin: "4px 0 0", fontSize: 13 }}
                  >
                    {review.challenges?.title}
                  </p>
                </div>
                <ReviewButtons checkInId={review.id} />
              </div>
            </article>
          ))}
        </section>
      )}
      {participants.length > 0 && (
        <section>
          <div
            style={{
              margin: "30px 2px 12px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span className="eyebrow">Marcador rápido</span>
              <h2 style={{ margin: "4px 0 0" }}>Así va el pique</h2>
            </div>
            <Medal color="var(--gold)" />
          </div>
          <div className="card" style={{ padding: "6px 18px" }}>
            {participants.slice(0, 3).map((participant, index) => {
              const profileValue = Array.isArray(participant.profiles)
                ? participant.profiles[0]
                : participant.profiles;
              return (
                <div
                  key={`${participant.user_id}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 0",
                    borderBottom:
                      index < Math.min(participants.length, 3) - 1
                        ? "1px solid var(--line)"
                        : 0,
                  }}
                >
                  <b
                    style={{
                      width: 22,
                      color: index === 0 ? "var(--gold)" : "var(--muted)",
                    }}
                  >
                    #{index + 1}
                  </b>
                  <Avatar
                    name={profileValue?.display_name ?? "Jugador"}
                    size={36}
                    accent={index === 0 ? "var(--lime)" : "var(--violet)"}
                  />
                  <span style={{ flex: 1, fontWeight: 800 }}>
                    {profileValue?.display_name}
                  </span>
                  <strong>{participant.score} pt</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {activities.length > 0 && (
        <section>
          <div style={{ margin: "30px 2px 12px" }}>
            <span className="eyebrow">En tu círculo</span>
            <h2 style={{ margin: "4px 0 0" }}>Actividad reciente</h2>
          </div>
          <div className="card" style={{ padding: "5px 18px" }}>
            {activities.slice(0, 5).map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  padding: "14px 0",
                  borderBottom:
                    index < Math.min(activities.length, 5) - 1
                      ? "1px solid var(--line)"
                      : 0,
                }}
              >
                <b>
                  {activity.type === "STREAK_INCREASED"
                    ? `${String(activity.payload.displayName ?? "Alguien")} lleva ${String(activity.payload.streak ?? "")} días de racha 🔥`
                    : activity.type === "CHALLENGE_LEAD"
                      ? `${String(activity.payload.displayName ?? "Alguien")} se ha puesto por delante`
                      : activity.type === "CHALLENGE_COMPLETED"
                        ? "Reto terminado. Ya hay veredicto."
                        : "Hay movimiento en el reto"}
                </b>
                <small
                  className="muted"
                  style={{ display: "block", marginTop: 4 }}
                >
                  {new Date(activity.created_at).toLocaleString("es", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      <div
        className="card"
        style={{
          marginTop: 28,
          padding: 18,
          display: "flex",
          gap: 12,
          background: "rgb(200 255 55 / 14%)",
        }}
      >
        <Sparkles color="var(--violet)" />
        <p style={{ margin: 0, lineHeight: 1.45, fontSize: 14 }}>
          <b>Consejo Pique:</b> una consecuencia divertida motiva más que una
          humillación. Siempre segura y consentida.
        </p>
      </div>
    </main>
  );
}
