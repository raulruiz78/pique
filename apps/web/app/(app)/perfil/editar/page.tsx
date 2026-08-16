import { EmptyState } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditProfilePage() {
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
  const user = await getCurrentUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,display_name,timezone,locale")
    .eq("id", user!.id)
    .single();
  return (
    <main className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/perfil"
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <h1
          className="display"
          style={{ color: "var(--violet)", fontSize: 26, margin: 0 }}
        >
          Editar perfil
        </h1>
      </header>
      <div style={{ marginTop: 26 }}>
        {profile && <ProfileForm profile={profile} />}
      </div>
    </main>
  );
}
