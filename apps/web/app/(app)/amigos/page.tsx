import { EmptyState } from "@/components/empty-state";
import { FriendsManager } from "@/components/friends-manager";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArrowLeft, UsersRound } from "lucide-react";
import Link from "next/link";

export default async function FriendsPage() {
  const supabase = await createServerSupabase();
  if (!supabase)
    return (
      <main className="page">
        <EmptyState
          title="Supabase pendiente"
          text="Configura .env.local para cargar tus amigos."
        />
      </main>
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: friendships } = await supabase
    .from("friendships")
    .select("id,requester_id,addressee_id,status,created_at")
    .neq("status", "BLOCKED")
    .order("created_at", { ascending: false });

  const otherIds = Array.from(
    new Set(
      (friendships ?? []).map((row) =>
        row.requester_id === user!.id ? row.addressee_id : row.requester_id,
      ),
    ),
  );
  const { data: profiles } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_path")
        .in("id", otherIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));

  const items = (friendships ?? []).map((row) => {
    const isRequester = row.requester_id === user!.id;
    const otherId = isRequester ? row.addressee_id : row.requester_id;
    return {
      id: row.id,
      status: row.status as "PENDING" | "ACCEPTED" | "REJECTED",
      direction: (isRequester ? "OUTGOING" : "INCOMING") as
        | "OUTGOING"
        | "INCOMING",
      profile: profileById.get(otherId) ?? null,
    };
  });

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
          href="/perfil"
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
            Amigos
          </h1>
        </div>
        <UsersRound color="var(--violet)" />
      </header>
      <FriendsManager items={items} />
    </main>
  );
}
