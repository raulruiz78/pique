import { Avatar } from "@/components/avatar";
import { CheckInButton } from "@/components/check-in-button";
import { EmptyState } from "@/components/empty-state";
import {
  EvidenceReviewCard,
  type EvidenceReview,
} from "@/components/evidence-review-card";
import { CategoryBadge } from "@/components/challenge-category";
import { MultiplierBadge } from "@/components/multiplier-badge";
import { NotificationBell } from "@/components/notification-bell";
import {
  myShieldCountsQuery,
  pendingReviewsQuery,
  profileSummaryQuery,
  todayOccurrencesQuery,
  unreadNotificationsCountQuery,
} from "@/lib/queries";
import { ChevronRight, Clock3, Flame, Award, History } from "lucide-react";
import Link from "next/link";

interface Relation {
  id?: string;
  name?: string;
  recurrence?: string;
  base_points?: number;
  evidence_required?: boolean;
  streak_multiplier_enabled?: boolean;
  title?: string;
  category?: string;
  circle_id?: string;
  challenge_participants?: { user_id: string; streak_days: number }[];
}
export default async function TodayPage() {
  const now = new Date();
  const summary = await profileSummaryQuery();
  const profile = summary?.profile as {
    display_name?: string;
    avatar_path?: string | null;
    total_points?: number;
    current_streak?: number;
    timezone?: string;
  } | null;
  const [rawOccurrences, reviewRows, unreadNotifications, shieldCounts] =
    await Promise.all([
      todayOccurrencesQuery(profile?.timezone ?? "Europe/Madrid"),
      pendingReviewsQuery(),
      unreadNotificationsCountQuery(),
      myShieldCountsQuery(),
    ]);
  const occurrences = rawOccurrences as unknown as Array<{
    id: string;
    status: string;
    starts_at: string;
    closes_at: string;
    goals: Relation | Relation[];
    challenges: Relation | Relation[];
    check_ins:
      | {
          id: string;
          validations: Array<{
            reason: string | null;
            decision: string;
            created_at: string;
          }>;
        }
      | {
          id: string;
          validations: Array<{
            reason: string | null;
            decision: string;
            created_at: string;
          }>;
        }[]
      | null;
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
    // La ventana de "hoy" está en la zona horaria del perfil, pero las
    // ocurrencias fijas se generan en días naturales UTC: cerca de la
    // medianoche local ambas franjas (UTC de ayer y de hoy) solapan la
    // consulta y traen dos filas del mismo objetivo. Como esta página ya
    // sólo pide un día, agrupar por objetivo (y no por fila) las colapsa.
    const key = multiple
      ? `${goal?.id}-${recurrence.includes("FLEX=") ? occurrence.closes_at : occurrence.starts_at.slice(0, 10)}`
      : (goal?.id ?? occurrence.id);
    const group = groupedOccurrences.get(key) ?? { items: [], multiple };
    group.items.push(occurrence);
    groupedOccurrences.set(key, group);
  }
  const objectiveCards = [...groupedOccurrences.values()];
  const reviews = reviewRows as unknown as EvidenceReview[];
  const displayName = profile?.display_name ?? "jugador";
  const totalPoints = profile?.total_points ?? 0;
  const level = Math.floor(totalPoints / 500) + 1;
  const levelProgress = totalPoints % 500;
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/perfil" aria-label="Tu perfil">
            <Avatar
              name={displayName}
              size={48}
              src={
                profile?.avatar_path && summary?.user?.id
                  ? `/api/v1/media/profiles/${summary.user.id}`
                  : null
              }
            />
          </Link>
          <div>
            <span className="eyebrow">Tu día</span>
            <h1
              className="display"
              style={{
                color: "var(--violet)",
                fontSize: 27,
                margin: "4px 0 0",
              }}
            >
              Hoy toca dar la talla.
            </h1>
          </div>
        </div>
        <NotificationBell
          userId={summary?.user?.id}
          unreadCount={unreadNotifications}
        />
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
        <div className="stat-card stat-points">
          <span className="field-label" style={{ color: "var(--muted)" }}>
            Puntos totales
          </span>
          <strong
            className="display"
            style={{
              color: "var(--violet)",
              display: "block",
              fontSize: 39,
              marginTop: 12,
            }}
          >
            {totalPoints.toLocaleString("es")}
          </strong>
          <Award className="stat-watermark" aria-hidden="true" />
        </div>
        <div className="stat-card stat-streak">
          <span className="field-label" style={{ color: "var(--muted)" }}>
            Racha actual
          </span>
          <strong
            className="display"
            style={{
              color: "var(--lime)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 30,
              marginTop: 12,
            }}
          >
            <Flame size={24} />
            {profile?.current_streak ?? 0} días
          </strong>
          <Flame className="stat-watermark" aria-hidden="true" />
        </div>
      </section>
      <section style={{ margin: "-10px 0 30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <small className="field-label" style={{ margin: 0 }}>
            Nivel {level}
          </small>
          <small className="muted">{levelProgress}/500 para subir</small>
        </div>
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{
              width: `${(levelProgress / 500) * 100}%`,
              background: "var(--lime)",
            }}
          />
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
        <div style={{ display: "flex", gap: 6 }}>
          <Link
            href={"/mis-pruebas" as "/hoy"}
            aria-label="Ver mis pruebas enviadas"
            className="button button-secondary"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <History size={18} />
          </Link>
          <Link
            href="/calendario"
            aria-label="Ver calendario"
            className="button button-secondary"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
      {objectiveCards.length === 0 ? (
        <EmptyState
          title={summary ? "Hoy tienes vía libre" : "Conecta tu base de datos"}
          text={
            summary
              ? "No hay objetivos para hoy. Puedes preparar el próximo reto."
              : "No se ha podido conectar con el servicio. Inténtalo de nuevo en unos minutos."
          }
          href="/crear"
          action="Crear un reto"
        />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {objectiveCards.map(({ items, multiple }) => {
            // El agrupado por goal.id (comentario arriba) puede juntar la
            // ocurrencia de hoy con una de ayer que ya se resolvió (solape
            // de huso horario). Antes, si ninguna estaba PENDING —p. ej.
            // justo tras enviar el check-in de hoy, que pasa a SUBMITTED—
            // el fallback caía en items[0], que por orden de consulta
            // (starts_at ascendente) era la más ANTIGUA, no la de hoy. Por
            // eso un envío fresco podía mostrarse como "RECHAZADO" con el
            // motivo de un rechazo de otro día. Ordenar por starts_at
            // descendente antes del fallback garantiza que, sin ninguna
            // PENDING, se muestre siempre la ocurrencia más reciente.
            const byRecency = [...items].sort(
              (a, b) =>
                new Date(b.starts_at).getTime() -
                new Date(a.starts_at).getTime(),
            );
            const occurrence =
              byRecency.find(
                (item) =>
                  item.status === "PENDING" && new Date(item.closes_at) >= now,
              ) ??
              byRecency.find((item) => item.status === "PENDING") ??
              byRecency[0]!;
            const goal = Array.isArray(occurrence.goals)
              ? occurrence.goals[0]
              : occurrence.goals;
            const challenge = Array.isArray(occurrence.challenges)
              ? occurrence.challenges[0]
              : occurrence.challenges;
            const completed = items.filter(
              (item) => item.status !== "PENDING",
            ).length;
            // Objetivo simple (no multiple): "listo" debe mirar solo la
            // ocurrencia que se muestra de verdad (occurrence, ya elegida
            // arriba priorizando la pendiente), no cualquier fila del grupo.
            // Si el agrupado por goal.id junta la de hoy (pendiente) con una
            // de ayer ya resuelta (solape de huso horario cerca de
            // medianoche, mismo origen que el bug de duplicados de 0.6.0),
            // usar items.some() marcaba "LISTO" y ocultaba el botón de
            // check-in aunque la de hoy siguiera pendiente.
            const rejected = !multiple && occurrence.status === "REJECTED";
            const done = multiple
              ? completed === items.length
              : occurrence.status !== "PENDING" && !rejected;
            const checkIn = Array.isArray(occurrence.check_ins)
              ? occurrence.check_ins[0]
              : occurrence.check_ins;
            const rejectionReason = rejected
              ? [...(checkIn?.validations ?? [])]
                  .filter((item) => item.decision === "REJECTED")
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
                  ?.reason
              : null;
            return (
              <article
                className="card"
                key={`${occurrence.id}-${items.length}`}
                style={{
                  overflow: "hidden",
                  borderLeft: `5px solid ${rejected ? "var(--danger)" : done ? "var(--success)" : "var(--violet)"}`,
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
                  <CategoryBadge category={challenge?.category} />
                  <div style={{ flex: 1 }}>
                    <span
                      className={`pill ${rejected ? "pill-violet" : done ? "pill-lime" : "pill-violet"}`}
                      style={
                        rejected
                          ? {
                              background: "rgb(255 180 171 / 16%)",
                              color: "var(--danger)",
                            }
                          : undefined
                      }
                    >
                      {rejected ? (
                        "RECHAZADO"
                      ) : done ? (
                        "LISTO"
                      ) : (
                        <>
                          <Clock3 size={12} /> HOY · {goal?.base_points ?? 0} PT
                        </>
                      )}
                    </span>{" "}
                    <MultiplierBadge
                      enabled={goal?.streak_multiplier_enabled ?? false}
                      streakDays={
                        challenge?.challenge_participants?.find(
                          (participant) =>
                            participant.user_id === summary?.user?.id,
                        )?.streak_days ?? 0
                      }
                    />
                    <h3 style={{ fontSize: 21, margin: "12px 0 3px" }}>
                      {goal?.name}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                      {challenge?.title}
                      {multiple &&
                        ` · ${completed} de ${items.length} completados`}
                    </p>
                    {rejected && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 13,
                          color: "var(--danger)",
                        }}
                      >
                        {rejectionReason
                          ? `Tu rival dice: «${rejectionReason}»`
                          : "Tu rival no lo ha dado por bueno. Prueba otra vez."}
                      </p>
                    )}
                  </div>
                  {(!done || rejected) && (
                    <CheckInButton
                      occurrenceId={occurrence.id}
                      evidenceRequired={Boolean(goal?.evidence_required)}
                      title={goal?.name ?? "Objetivo"}
                      resubmit={rejected}
                      shieldCount={
                        (challenge?.circle_id &&
                          shieldCounts.get(challenge.circle_id)) ||
                        0
                      }
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
          <div
            style={{
              margin: "34px 2px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <h2 style={{ margin: 0, maxWidth: 260 }}>
              Pendientes de validación
            </h2>
            <Link href={"/validaciones" as "/hoy"} className="eyebrow">
              Ver todo
            </Link>
          </div>
          <div className="review-carousel">
            {reviews.slice(0, 8).map((review) => (
              <EvidenceReviewCard key={review.id} review={review} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
