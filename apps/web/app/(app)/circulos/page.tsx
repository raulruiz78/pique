import { CircleManager } from "@/components/circle-manager";
import { Avatar } from "@/components/avatar";
import { createServerSupabase } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import Link from "next/link";

export default async function CirclesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: circles } = supabase
    ? await supabase
        .from("circles")
        .select(
          "id,name,description,avatar_path,owner_id,circle_members(user_id),challenges(id,status,challenge_participants(user_id,acceptance))",
        )
        .order("created_at", { ascending: false })
    : { data: null };
  const { data: profile } =
    supabase && user
      ? await supabase
          .from("profiles")
          .select("display_name,avatar_path")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };
  const pendingCount = (circles ?? []).reduce(
    (total, circle) =>
      total +
      circle.challenges.filter((challenge) =>
        challenge.challenge_participants.some(
          (participant) =>
            participant.user_id === user?.id &&
            participant.acceptance === "PENDING",
        ),
      ).length,
    0,
  );

  return (
    <main className="page">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 38,
        }}
      >
        <Avatar
          name={profile?.display_name ?? "Pique"}
          size={48}
          src={
            profile?.avatar_path && user
              ? `/api/v1/media/profiles/${user.id}`
              : null
          }
        />
        <h2
          className="display"
          style={{ color: "var(--violet)", fontSize: 26, margin: 0, flex: 1 }}
        >
          Hoy toca dar la talla.
        </h2>
        <Link
          href="/notificaciones"
          className="button button-secondary"
          aria-label="Notificaciones"
          style={{ width: 48, padding: 0 }}
        >
          <Bell />
        </Link>
      </header>
      <header>
        <span className="eyebrow" style={{ color: "var(--lime)" }}>
          Comunidad
        </span>
        <h1 className="display screen-title">Tus Círculos</h1>
        <p className="muted" style={{ margin: 0 }}>
          Entra en un círculo para ver qué se juega y quién manda.
        </p>
      </header>

      <div style={{ marginTop: 38 }}>
        <CircleManager
          pendingCount={pendingCount}
          circles={(circles ?? []).map((circle) => ({
            id: circle.id,
            name: circle.name,
            description: circle.description,
            imageSrc: circle.avatar_path
              ? `/api/v1/media/circles/${circle.id}?v=${encodeURIComponent(circle.avatar_path)}`
              : null,
            isOwner: circle.owner_id === user?.id,
            memberCount: circle.circle_members.length,
            activeCount: circle.challenges.filter(
              (challenge) => challenge.status === "ACTIVE",
            ).length,
          }))}
        />
      </div>
    </main>
  );
}
