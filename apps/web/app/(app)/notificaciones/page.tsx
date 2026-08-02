import { EmptyState } from "@/components/empty-state";
import { MarkNotificationsRead } from "@/components/notification-list";
import { createServerSupabase } from "@/lib/supabase/server";
import { Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
export default async function NotificationsPage() {
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase
        .from("notifications")
        .select("id,title,body,href,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };
  return (
    <main className="page">
      <header
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <span className="eyebrow">Al día</span>
          <h1 className="display" style={{ fontSize: 43, margin: "6px 0 0" }}>
            Notificaciones
          </h1>
        </div>
        <MarkNotificationsRead />
      </header>
      <div style={{ marginTop: 24 }}>
        {!data?.length ? (
          <EmptyState
            title="Todo tranquilo"
            text="Aquí llegarán invitaciones, validaciones, rachas en riesgo y finales de reto."
          />
        ) : (
          <div className="card" style={{ padding: "5px 18px" }}>
            {data.map((item, index) => (
              <Link
                href={(item.href || "/hoy") as "/hoy"}
                key={item.id}
                style={{
                  display: "flex",
                  gap: 13,
                  padding: "16px 0",
                  borderBottom:
                    index < data.length - 1 ? "1px solid var(--line)" : 0,
                  textDecoration: "none",
                  color: "var(--ink)",
                }}
              >
                {item.read_at ? (
                  <CheckCircle2 color="var(--muted)" />
                ) : (
                  <Bell color="var(--violet)" />
                )}
                <div>
                  <b>{item.title}</b>
                  <p
                    className="muted"
                    style={{ margin: "5px 0 0", fontSize: 14, lineHeight: 1.4 }}
                  >
                    {item.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
