import { CircleDashed } from "lucide-react";
import Link from "next/link";

export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "42px 26px" }}>
      <CircleDashed
        size={34}
        color="var(--violet)"
        style={{ margin: "0 auto 16px" }}
      />
      <h2 style={{ margin: "0 0 8px" }}>{title}</h2>
      <p
        className="muted"
        style={{ lineHeight: 1.5, margin: "0 auto", maxWidth: 310 }}
      >
        {text}
      </p>
      {href && action && (
        <Link
          className="button button-primary"
          href={href as "/crear"}
          style={{ marginTop: 22 }}
        >
          {action}
        </Link>
      )}
    </div>
  );
}
