import { EmptyState } from "@/components/empty-state";
import { PrivacyForm } from "@/components/privacy-form";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PrivacyPage() {
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_visibility")
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
          Privacidad del perfil
        </h1>
      </header>
      <p className="muted" style={{ margin: "18px 2px 24px" }}>
        Decide quién puede ver tu perfil, tu racha y tus puntos.
      </p>
      <PrivacyForm
        profileVisibility={profile?.profile_visibility ?? "FRIENDS"}
      />
    </main>
  );
}
