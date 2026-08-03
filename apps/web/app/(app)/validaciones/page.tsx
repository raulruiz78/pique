import { EmptyState } from "@/components/empty-state";
import {
  EvidenceReviewCard,
  type EvidenceReview,
} from "@/components/evidence-review-card";
import { dashboardQuery } from "@/lib/queries";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default async function ValidationsPage() {
  const data = await dashboardQuery();
  const reviews = (data?.reviews ?? []) as unknown as EvidenceReview[];
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
          title="Todo revisado"
          text="No tienes evidencias pendientes de validación."
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
      <div
        className="stitch-card"
        style={{ display: "flex", gap: 12, padding: 18, marginTop: 18 }}
      >
        <ShieldCheck color="var(--violet)" />
        <small className="muted">
          Valida únicamente lo acordado en las reglas del reto.
        </small>
      </div>
    </main>
  );
}
