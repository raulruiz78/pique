/* eslint-disable @next/next/no-img-element */
import { Avatar } from "./avatar";
import { ReviewButtons } from "./review-button";

export type EvidenceReview = {
  id: string;
  user_id: string;
  note: string | null;
  profiles: { display_name?: string; avatar_path?: string | null };
  challenges: { title?: string };
  evidenceUrl: string | null;
};

export function EvidenceReviewCard({
  review,
  compact = false,
}: {
  review: EvidenceReview;
  compact?: boolean;
}) {
  const name = review.profiles?.display_name ?? "Tu rival";
  return (
    <article className="stitch-card review-card" data-compact={compact}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: compact ? "12px 14px" : "18px",
        }}
      >
        <Avatar
          name={name}
          size={compact ? 34 : 44}
          accent="var(--lime)"
          src={
            review.profiles?.avatar_path
              ? `/api/v1/media/profiles/${review.user_id}`
              : null
          }
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {!compact && <span className="eyebrow">Evidencia de</span>}
          <b
            style={{
              display: "block",
              fontSize: compact ? undefined : 22,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </b>
          <small className="muted">{review.challenges?.title}</small>
        </div>
      </div>
      {review.evidenceUrl ? (
        <img
          src={review.evidenceUrl}
          alt={`Evidencia enviada por ${name}`}
          className="review-card-image"
        />
      ) : (
        <div
          className="review-card-image"
          style={{ display: "grid", placeItems: "center" }}
        >
          <span className="muted">Evidencia sin foto</span>
        </div>
      )}
      <div style={{ padding: compact ? 14 : 18 }}>
        {review.note && (
          <p
            style={{
              margin: "0 0 14px",
              fontStyle: "italic",
              lineHeight: 1.45,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: compact ? "nowrap" : "normal",
            }}
          >
            &ldquo;{review.note}&rdquo;
          </p>
        )}
        <ReviewButtons checkInId={review.id} />
      </div>
    </article>
  );
}
