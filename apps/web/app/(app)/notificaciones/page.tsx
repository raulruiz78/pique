import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/avatar";
import { MarkNotificationsRead } from "@/components/notification-list";
import { NotificationRow } from "@/components/notification-row";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
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
        .is("read_at", null)
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
        <Link href="/perfil" aria-label="Tu perfil">
          <Avatar
            name={profile?.display_name ?? "Pique"}
            size={46}
            src={
              profile?.avatar_path && user
                ? `/api/v1/media/profiles/${user.id}`
                : null
            }
          />
        </Link>
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
            title="Bandeja a cero"
            text="En cuanto pase algo — validación, racha en riesgo, reto que se acaba — aparece aquí."
          />
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {data.map((item) => (
              <NotificationRow item={item} key={item.id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
