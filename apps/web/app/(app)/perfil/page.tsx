import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out";
import { createServerSupabase } from "@/lib/supabase/server";
import { Bell, LockKeyhole, ShieldCheck } from "lucide-react";
export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  if (!supabase)
    return (
      <main className="page">
        <EmptyState
          title="Supabase pendiente"
          text="Configura .env.local para cargar tu perfil real."
        />
      </main>
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await supabase
    .from("profiles")
    .select("username,display_name,timezone,locale,total_points,current_streak")
    .eq("id", user!.id)
    .single();
  const value = profile.data;
  return (
    <main className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <Avatar
          name={value?.display_name ?? "Pique"}
          size={67}
          accent="var(--violet)"
        />
        <div>
          <span className="eyebrow">Tu espacio</span>
          <h1 className="display" style={{ fontSize: 39, margin: "5px 0 2px" }}>
            {value?.display_name}
          </h1>
          <span className="muted">@{value?.username}</span>
        </div>
      </header>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          margin: "24px 0",
        }}
      >
        <div className="card" style={{ padding: 17 }}>
          <strong className="display" style={{ fontSize: 29 }}>
            {value?.total_points ?? 0}
          </strong>
          <small className="muted" style={{ display: "block", marginTop: 4 }}>
            puntos totales
          </small>
        </div>
        <div className="card" style={{ padding: 17 }}>
          <strong className="display" style={{ fontSize: 29 }}>
            {value?.current_streak ?? 0}
          </strong>
          <small className="muted" style={{ display: "block", marginTop: 4 }}>
            mejor racha
          </small>
        </div>
      </section>
      <h2>Tu perfil</h2>
      {value && <ProfileForm profile={value} />}
      <h2 style={{ marginTop: 30 }}>Privacidad y avisos</h2>
      <div className="card" style={{ padding: "4px 17px" }}>
        {[
          [LockKeyhole, "Perfil solo para amigos"],
          [Bell, "Notificaciones y horas silenciosas"],
          [ShieldCheck, "Bloqueos y denuncias"],
        ].map(([Icon, label], index) => {
          const Comp = Icon as typeof Bell;
          return (
            <button
              key={String(label)}
              className="button"
              style={{
                width: "100%",
                justifyContent: "start",
                padding: "0 3px",
                borderRadius: 0,
                background: "transparent",
                color: "var(--ink)",
                borderBottom: index < 2 ? "1px solid var(--line)" : 0,
              }}
            >
              <Comp size={18} color="var(--violet)" />
              {String(label)}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 22 }}>
        <SignOutButton />
      </div>
    </main>
  );
}
