import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/avatar";
import { MarkNotificationsRead } from "@/components/notification-list";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { ArrowLeft, Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
export default async function NotificationsPage() {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const { data: profile } =
    supabase && user
      ? await supabase
          .from("profiles")
          .select("display_name,avatar_path")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };
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
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/hoy"
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <div style={{ flex: 1 }}>
          <h1
            className="display"
            style={{ color: "var(--violet)", fontSize: 30, margin: 0 }}
          >
            Notificaciones
          </h1>
        </div>
        <Avatar
          name={profile?.display_name ?? "Pique"}
          size={46}
          src={
            profile?.avatar_path && user
              ? `/api/v1/media/profiles/${user.id}`
              : null
          }
        />
      </header>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 34,
        }}
      >
        <div>
          <span className="eyebrow">Hoy</span>
          <h2 style={{ margin: "6px 0 0" }}>Actividad reciente</h2>
        </div>
        <MarkNotificationsRead />
      </div>
      <div style={{ marginTop: 24 }}>
        {!data?.length ? (
          <EmptyState
            title="Todo tranquilo"
            text="Aquí llegarán invitaciones, validaciones, rachas en riesgo y finales de reto."
          />
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {data.map((item) => (
              <Link
                href={(item.href || "/hoy") as "/hoy"}
                key={item.id}
                style={{
                  display: "flex",
                  gap: 13,
                  padding: "20px 18px 20px 22px",
                  border: "1px solid var(--line)",
                  borderLeft: item.read_at
                    ? "1px solid var(--line)"
                    : "4px solid var(--violet)",
                  borderRadius: 24,
                  background: item.read_at
                    ? "var(--surface)"
                    : "linear-gradient(135deg,rgb(210 187 255 / 8%),var(--surface))",
                  textDecoration: "none",
                  color: "var(--ink)",
                }}
              >
                {item.read_at ? (
                  <CheckCircle2 color="var(--muted)" />
                ) : (
                  <Bell color="var(--violet)" />
                )}
                <div style={{ flex: 1 }}>
                  <b>{item.title}</b>
                  <p
                    className="muted"
                    style={{ margin: "5px 0 0", fontSize: 14, lineHeight: 1.4 }}
                  >
                    {item.body}
                  </p>
                  <small
                    className="eyebrow"
                    style={{ display: "block", marginTop: 10 }}
                  >
                    {new Intl.DateTimeFormat("es", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.created_at))}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
