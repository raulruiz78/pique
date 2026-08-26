"use client";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationRow({
  item,
}: {
  item: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    created_at: string;
  };
}) {
  return (
    <Link
      href={(item.href || "/hoy") as "/hoy"}
      onClick={() => {
        void fetch("/api/v1/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
      }}
      style={{
        display: "flex",
        gap: 13,
        padding: "20px 18px 20px 22px",
        border: "1px solid var(--line)",
        borderLeft: "4px solid var(--violet)",
        borderRadius: 24,
        background:
          "linear-gradient(135deg,rgb(210 187 255 / 8%),var(--surface))",
        textDecoration: "none",
        color: "var(--ink)",
      }}
    >
      <Bell color="var(--violet)" />
      <div style={{ flex: 1 }}>
        <b>{item.title}</b>
        <p
          className="muted"
          style={{ margin: "5px 0 0", fontSize: 14, lineHeight: 1.4 }}
        >
          {item.body}
        </p>
        <small className="eyebrow" style={{ display: "block", marginTop: 10 }}>
          {new Intl.DateTimeFormat("es", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(item.created_at))}
        </small>
      </div>
    </Link>
  );
}
