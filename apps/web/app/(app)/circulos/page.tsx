import { CircleManager } from "@/components/circle-manager";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function CirclesPage() {
  const supabase = await createServerSupabase();
  const { data: circles } = supabase
    ? await supabase
        .from("circles")
        .select(
          "id,name,description,circle_members(user_id),challenges(id,status,challenge_participants(user_id,acceptance))",
        )
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <main className="page">
      <header>
        <span className="eyebrow">Tu gente, tus piques</span>
        <h1 className="display" style={{ fontSize: 44, margin: "6px 0 8px" }}>
          Círculos
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Entra en un círculo para ver qué se juega y quién manda.
        </p>
      </header>

      <div style={{ marginTop: 28 }}>
        <CircleManager
          circles={(circles ?? []).map((circle) => ({
            id: circle.id,
            name: circle.name,
            description: circle.description,
            memberCount: circle.circle_members.length,
            activeCount: circle.challenges.filter((challenge) =>
              ["ACTIVE", "SCHEDULED", "PENDING_ACCEPTANCE"].includes(
                challenge.status,
              ),
            ).length,
          }))}
        />
      </div>
    </main>
  );
}
