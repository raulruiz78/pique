import { Avatar } from "@/components/avatar";
import { ChallengeActions } from "@/components/challenge-actions";
import { ImageUpload } from "@/components/image-upload";
import { createServerSupabase } from "@/lib/supabase/server";
import { ChevronRight, Clock3, Trophy, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Player = {
  user_id: string;
  acceptance: string;
  score: number;
  current_streak: number;
  profiles: { display_name?: string; username?: string } | null;
};

export default async function CirclePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) notFound();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: circle } = await supabase
    .from("circles")
    .select(
      "id,name,description,avatar_path,owner_id,circle_members(user_id,profiles(display_name,username)),challenges(id,title,status,start_at,end_at,challenge_participants(user_id,acceptance,score,current_streak,profiles(display_name,username)))",
    )
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) notFound();

  const pending = circle.challenges.filter((challenge) =>
    challenge.challenge_participants.some(
      (player) =>
        player.user_id === user?.id && player.acceptance === "PENDING",
    ),
  );
  const playable = circle.challenges.filter((challenge) =>
    ["ACTIVE", "SCHEDULED", "COMPLETED"].includes(challenge.status),
  );
  const totals = new Map<
    string,
    { userId: string; name: string; score: number; streak: number }
  >();
  for (const challenge of playable) {
    for (const player of challenge.challenge_participants as Player[]) {
      const current = totals.get(player.user_id);
      totals.set(player.user_id, {
        userId: player.user_id,
        name:
          player.profiles?.display_name ??
          player.profiles?.username ??
          "Jugador",
        score: (current?.score ?? 0) + player.score,
        streak: Math.max(current?.streak ?? 0, player.current_streak),
      });
    }
  }
  const ranking = [...totals.values()].sort((a, b) => b.score - a.score);

  return (
    <main className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <Avatar
          name={circle.name}
          size={67}
          accent="var(--lime)"
          src={
            circle.avatar_path
              ? `/api/v1/media/circles/${circle.id}?v=${encodeURIComponent(circle.avatar_path)}`
              : null
          }
        />
        <div>
          <span className="eyebrow">Círculo</span>
          <h1 className="display" style={{ fontSize: 42, margin: "6px 0 8px" }}>
            {circle.name}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {circle.description ||
              `${circle.circle_members.length} personas en el pique.`}
          </p>
        </div>
      </header>

      {circle.owner_id === user?.id && (
        <section style={{ marginTop: 20 }}>
          <ImageUpload
            endpoint={`/api/v1/circles/${circle.id}/image`}
            hasImage={Boolean(circle.avatar_path)}
            label="Foto del círculo"
          />
        </section>
      )}

      {pending.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <span className="eyebrow">Necesitan tu respuesta</span>
          <div style={{ display: "grid", gap: 11, marginTop: 10 }}>
            {pending.map((challenge) => (
              <article
                key={challenge.id}
                className="card"
                style={{ padding: 18, borderLeft: "5px solid var(--coral)" }}
              >
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <Clock3 color="var(--coral)" />
                  <div>
                    <b>{challenge.title}</b>
                    <small
                      className="muted"
                      style={{ display: "block", marginTop: 3 }}
                    >
                      Te han retado. Revisa y responde.
                    </small>
                  </div>
                </div>
                <ChallengeActions challengeId={challenge.id} />
              </article>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <span className="eyebrow">Total del círculo</span>
        <h2 style={{ margin: "6px 0 12px" }}>Clasificación</h2>
        <div className="card" style={{ padding: "5px 18px" }}>
          {ranking.length === 0 ? (
            <p className="muted">Aún no hay puntos en juego.</p>
          ) : (
            ranking.map((player, index) => {
              const difference = (ranking[0]?.score ?? 0) - player.score;
              return (
                <div
                  key={player.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "14px 0",
                    borderBottom:
                      index < ranking.length - 1 ? "1px solid var(--line)" : 0,
                  }}
                >
                  <b
                    style={{
                      width: 23,
                      color: index === 0 ? "var(--gold)" : "var(--muted)",
                    }}
                  >
                    #{index + 1}
                  </b>
                  <Avatar
                    name={player.name}
                    size={38}
                    accent={index === 0 ? "var(--lime)" : "var(--violet)"}
                  />
                  <div style={{ flex: 1 }}>
                    <b>{player.name}</b>
                    <small className="muted" style={{ display: "block" }}>
                      {difference === 0
                        ? `${player.streak} de racha`
                        : `a ${difference} pt del líder`}
                    </small>
                  </div>
                  <strong>{player.score} pt</strong>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <span className="eyebrow">Reto a reto</span>
        <h2 style={{ margin: "6px 0 12px" }}>Marcadores</h2>
        <div style={{ display: "grid", gap: 11 }}>
          {playable.map((challenge) => {
            const players = [
              ...(challenge.challenge_participants as Player[]),
            ].sort((a, b) => b.score - a.score);
            const lead =
              (players[0]?.score ?? 0) -
              (players[1]?.score ?? players[0]?.score ?? 0);
            return (
              <Link
                key={challenge.id}
                href={`/retos/${challenge.id}`}
                className="card"
                style={{ padding: 17, color: "inherit" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Trophy color="var(--violet)" />
                  <div style={{ flex: 1 }}>
                    <b>{challenge.title}</b>
                    <small
                      className="muted"
                      style={{ display: "block", marginTop: 3 }}
                    >
                      {lead === 0
                        ? "Empate"
                        : `${players[0]?.profiles?.display_name ?? "El líder"} gana por ${lead} pt`}
                    </small>
                  </div>
                  <ChevronRight />
                </div>
              </Link>
            );
          })}
          {playable.length === 0 && (
            <div className="card" style={{ padding: 20 }}>
              <UsersRound color="var(--violet)" />
              <p className="muted" style={{ marginBottom: 0 }}>
                Cuando aceptéis un reto, su marcador aparecerá aquí.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
