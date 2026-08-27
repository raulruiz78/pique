/* eslint-disable @next/next/no-img-element */
import { EmptyState } from "@/components/empty-state";
import { myCheckInsQuery } from "@/lib/queries";
import {
  ArrowLeft,
  Clock3,
  Eye,
  Check,
  X,
  History,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface Relation {
  title?: string;
  name?: string;
}
type MyCheckIn = {
  id: string;
  note: string | null;
  status: string;
  via_shield: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  challenges: Relation | Relation[] | null;
  goal_occurrences: {
    goals: Relation | Relation[] | null;
  } | null;
  validations: Array<{
    decision: string;
    reason: string | null;
    created_at: string;
    reviewer_id: string;
    profiles: { display_name?: string } | { display_name?: string }[] | null;
  }>;
  evidenceUrl: string | null;
};

const STATUS_LABEL: Record<
  string,
  { label: string; className: string; danger?: boolean; icon: typeof Clock3 }
> = {
  PENDING_REVIEW: { label: "EN REVISIÓN", className: "pill-violet", icon: Eye },
  APPROVED: { label: "APROBADO", className: "pill-lime", icon: Check },
  REJECTED: {
    label: "RECHAZADO",
    className: "pill-violet",
    danger: true,
    icon: X,
  },
  DISPUTED: { label: "EN DISPUTA", className: "pill-violet", icon: History },
  EXPIRED: { label: "CADUCADO", className: "pill-violet", icon: Clock3 },
};

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function MyCheckInsPage() {
  const rows = (await myCheckInsQuery()) as unknown as MyCheckIn[];
  return (
    <main className="page">
      <header className="screen-header">
        <Link
          href="/hoy"
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <div>
          <span className="eyebrow">Tu trazabilidad</span>
          <h1 className="display" style={{ fontSize: 32, margin: "5px 0 0" }}>
            Mis pruebas
          </h1>
        </div>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          title="Aún no has enviado nada"
          text="Cuando envíes una prueba de un objetivo, aquí verás cuándo se envió y qué se decidió."
        />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row) => {
            const goal = Array.isArray(row.goal_occurrences?.goals)
              ? row.goal_occurrences?.goals[0]
              : row.goal_occurrences?.goals;
            const challenge = Array.isArray(row.challenges)
              ? row.challenges[0]
              : row.challenges;
            const status = row.via_shield
              ? {
                  label: "COMODÍN",
                  className: "pill-lime",
                  icon: ShieldCheck,
                }
              : (STATUS_LABEL[row.status] ?? STATUS_LABEL.PENDING_REVIEW!);
            const StatusIcon = status.icon;
            const history = [...row.validations].sort((a, b) =>
              b.created_at.localeCompare(a.created_at),
            );
            return (
              <article key={row.id} className="card" style={{ padding: 19 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className={`pill ${status.className}`}
                      style={
                        status.danger
                          ? {
                              background: "rgb(255 180 171 / 16%)",
                              color: "var(--danger)",
                            }
                          : undefined
                      }
                    >
                      <StatusIcon size={12} /> {status.label}
                    </span>
                    <h3 style={{ fontSize: 19, margin: "10px 0 3px" }}>
                      {goal?.name ?? "Objetivo"}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                      {challenge?.title}
                    </p>
                  </div>
                  {row.evidenceUrl && (
                    <img
                      src={row.evidenceUrl}
                      alt="Tu prueba enviada"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <p
                  className="muted"
                  style={{
                    margin: "14px 0 0",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Clock3 size={13} /> Enviado el{" "}
                  {dateFormatter.format(new Date(row.submitted_at))}
                </p>
                {history.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid var(--line)",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {history.map((validation, index) => {
                      const reviewer = Array.isArray(validation.profiles)
                        ? validation.profiles[0]
                        : validation.profiles;
                      const decided = validation.decision === "APPROVED";
                      return (
                        <div
                          key={`${row.id}-${index}`}
                          style={{ fontSize: 13 }}
                        >
                          <span
                            style={{
                              color: decided ? "var(--lime)" : "var(--danger)",
                              fontWeight: 700,
                            }}
                          >
                            {decided ? "Aprobado" : "Rechazado"}
                          </span>{" "}
                          <span className="muted">
                            por {reviewer?.display_name ?? "tu rival"} ·{" "}
                            {dateFormatter.format(
                              new Date(validation.created_at),
                            )}
                          </span>
                          {validation.reason && (
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontStyle: "italic",
                                color: "var(--muted)",
                              }}
                            >
                              &ldquo;{validation.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
