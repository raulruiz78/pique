import { EmptyState } from "@/components/empty-state";
import {
  EvidenceReviewCard,
  type EvidenceReview,
} from "@/components/evidence-review-card";
import { myCheckInsQuery, pendingReviewsQuery } from "@/lib/queries";
import { ArrowLeft, Eye, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

interface Relation {
  title?: string;
  name?: string;
}
interface MyPendingCheckIn {
  id: string;
  status: string;
  submitted_at: string;
  challenges: Relation | Relation[] | null;
  goal_occurrences: { goals: Relation | Relation[] | null } | null;
}

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ValidationsPage() {
  const [reviewRows, myCheckInRows] = await Promise.all([
    pendingReviewsQuery(),
    myCheckInsQuery(),
  ]);
  const reviews = reviewRows as unknown as EvidenceReview[];
  const myPending = (myCheckInRows as unknown as MyPendingCheckIn[]).filter(
    (row) => row.status === "PENDING_REVIEW",
  );
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
          <span className="eyebrow">Te toca decidir</span>
          <h1 className="display" style={{ fontSize: 32, margin: "5px 0 0" }}>
            Validaciones
          </h1>
        </div>
      </header>
      {reviews.length === 0 ? (
        <EmptyState
          title="Nada que juzgar"
          text="Cuando tu rival mande una prueba, aparece aquí y decides tú."
        />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 2px 14px",
            }}
          >
            <span className="eyebrow">
              {reviews.length}{" "}
              {reviews.length === 1
                ? "evidencia pendiente"
                : "evidencias pendientes"}
            </span>
            <span className="pill pill-lime">
              <Zap size={14} /> Decide
            </span>
          </div>
          <div className="validation-deck">
            {reviews.map((review) => (
              <EvidenceReviewCard key={review.id} review={review} />
            ))}
          </div>
          {reviews.length > 1 && (
            <small
              className="muted"
              style={{ display: "block", textAlign: "center", marginTop: 8 }}
            >
              Desliza para revisar la siguiente prueba
            </small>
          )}
        </>
      )}
      {myPending.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <span className="eyebrow">En manos de tu rival</span>
          <h2 style={{ margin: "6px 0 12px" }}>Ya jugaste tu carta</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {myPending.map((row) => {
              const goal = Array.isArray(row.goal_occurrences?.goals)
                ? row.goal_occurrences?.goals[0]
                : row.goal_occurrences?.goals;
              const challenge = Array.isArray(row.challenges)
                ? row.challenges[0]
                : row.challenges;
              return (
                <div
                  key={row.id}
                  className="card"
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span className="pill pill-violet">
                    <Eye size={12} /> EN REVISIÓN
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 15 }}>{goal?.name ?? "Objetivo"}</b>
                    <small
                      className="muted"
                      style={{ display: "block", fontSize: 13 }}
                    >
                      {challenge?.title} · enviado el{" "}
                      {dateFormatter.format(new Date(row.submitted_at))}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <div
        className="stitch-card"
        style={{ display: "flex", gap: 12, padding: 18, marginTop: 18 }}
      >
        <ShieldCheck color="var(--violet)" />
        <small className="muted">
          Juzga solo lo pactado en las reglas — nada de manga ancha ni de
          tirria.
        </small>
      </div>
    </main>
  );
}
