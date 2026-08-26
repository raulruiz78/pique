import { ActivityFeed } from "@/components/activity-feed";
import { Avatar } from "@/components/avatar";
import { DeleteChallengeButton } from "@/components/delete-challenge-button";
import { PendingChallengeCard } from "@/components/pending-challenge-card";
import { RankingList } from "@/components/ranking-list";
import { CircleInviteButton } from "@/components/circle-invite-button";
import { CircleAccessPanel } from "@/components/circle-access-panel";
import { CategoryBadge } from "@/components/challenge-category";
import { MultiplierBadge } from "@/components/multiplier-badge";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Plus,
  Settings,
  Trophy,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Player = {
  user_id: string;
  acceptance: string;
  score: number;
  current_streak: number;
  streak_days: number;
  profiles: {
    display_name?: string;
    username?: string;
    avatar_path?: string | null;
  } | null;
};

export default async function CirclePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) notFound();
  const user = await getCurrentUser();
  const { data: circle } = await supabase
    .from("circles")
    .select(
      "id,name,description,avatar_path,owner_id,circle_members(user_id,profiles(display_name,username,avatar_path)),challenges(id,title,category,status,creator_id,start_at,end_at,goals(streak_multiplier_enabled),challenge_participants(user_id,acceptance,score,current_streak,streak_days,profiles(display_name,username,avatar_path)))",
    )
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select(
      "id,type,payload,created_at,actor_id,profiles(display_name,avatar_path),challenges(title),reactions(user_id,emoji)",
    )
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false })
    .limit(30);

  const pending = circle.challenges.filter((challenge) =>
    challenge.challenge_participants.some(
      (player) =>
        player.user_id === user?.id && player.acceptance === "PENDING",
    ),
  );
  const waitingOnOthers = circle.challenges.filter(
    (challenge) =>
      challenge.status === "PENDING_ACCEPTANCE" &&
      challenge.challenge_participants.some(
        (player) =>
          player.user_id === user?.id && player.acceptance === "ACCEPTED",
      ) &&
      challenge.challenge_participants.some(
        (player) => player.acceptance === "PENDING",
      ),
  );
  const playable = circle.challenges.filter((challenge) =>
    ["ACTIVE", "SCHEDULED", "COMPLETED"].includes(challenge.status),
  );
  const totals = new Map<
    string,
    {
      userId: string;
      name: string;
      avatarPath: string | null;
      score: number;
      streak: number;
    }
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
        avatarPath: player.profiles?.avatar_path ?? current?.avatarPath ?? null,
        score: (current?.score ?? 0) + player.score,
        streak: Math.max(current?.streak ?? 0, player.current_streak),
      });
    }
  }
  const ranking = [...totals.values()].sort((a, b) => b.score - a.score);
  const podiumSize = Math.min(ranking.length, 3);
  const podiumOrder =
    podiumSize === 3 ? [2, 1, 3] : podiumSize === 2 ? [2, 1] : [1];

  return (
    <main className="page">
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 26,
        }}
      >
        <Link
          href="/circulos"
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, minHeight: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <strong
          className="display"
          style={{ color: "var(--violet)", fontSize: 24, flex: 1 }}
        >
          {circle.name}
        </strong>
        <CircleInviteButton circleId={circle.id} compact />
        {circle.owner_id === user?.id && (
          <Link
            href={`/circulos/${circle.id}/ajustes`}
            aria-label="Ajustes del círculo"
            className="button button-secondary"
            style={{ width: 48, minHeight: 48, padding: 0 }}
          >
            <Settings size={18} />
          </Link>
        )}
      </nav>
      <header className="screen-header">
        <Avatar
          name={circle.name}
          size={58}
          accent="var(--lime)"
          src={
            circle.avatar_path
              ? `/api/v1/media/circles/${circle.id}?v=${encodeURIComponent(circle.avatar_path)}`
              : null
          }
        />
        <div>
          <span className="eyebrow">Círculo privado</span>
          <h1 className="display" style={{ fontSize: 30, margin: "5px 0" }}>
            {circle.name}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {circle.description ||
              `${circle.circle_members.length} personas en el pique.`}
          </p>
        </div>
      </header>
      {circle.owner_id === user?.id && (
        <CircleAccessPanel circleId={circle.id} />
      )}

      <Link
        href={`/crear?circleId=${circle.id}`}
        className="button button-primary"
        style={{ width: "100%", marginTop: 18 }}
      >
        <Plus size={18} /> Crear un reto
      </Link>

      {pending.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <span className="eyebrow">Necesitan tu respuesta</span>
          <div style={{ display: "grid", gap: 11, marginTop: 10 }}>
            {pending.map((challenge) => (
              <PendingChallengeCard
                key={challenge.id}
                challengeId={challenge.id}
                title={challenge.title}
              />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <span className="eyebrow">Podio general</span>
        <h2 style={{ margin: "6px 0 18px" }}>¿Quién manda?</h2>
        <div className="stitch-card" style={{ padding: 20 }}>
          {ranking.length === 0 ? (
            <p className="muted">Aún no hay puntos en juego.</p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${podiumOrder.length}, minmax(0,1fr))`,
                  gap: 8,
                  alignItems: "end",
                  margin: "8px 0 22px",
                  maxWidth:
                    podiumOrder.length < 3
                      ? podiumOrder.length * 120 + (podiumOrder.length - 1) * 8
                      : undefined,
                  marginInline: podiumOrder.length < 3 ? "auto" : undefined,
                }}
              >
                {podiumOrder.map((place) => {
                  const player = ranking[place - 1]!;
                  return (
                    <div
                      key={player.userId}
                      style={{
                        padding: place === 1 ? "24px 6px 18px" : "15px 6px",
                        borderRadius: "20px 20px 8px 8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        color: place === 1 ? "#162000" : "var(--ink)",
                        background:
                          place === 1 ? "var(--lime)" : "var(--surface-high)",
                      }}
                    >
                      <Avatar
                        name={player.name}
                        size={place === 1 ? 70 : 54}
                        accent={place === 1 ? "var(--lime)" : "var(--violet)"}
                        src={
                          player.avatarPath
                            ? `/api/v1/media/profiles/${player.userId}`
                            : null
                        }
                      />
                      <small style={{ display: "block", marginTop: 8 }}>
                        #{place}
                      </small>
                      <b
                        style={{
                          display: "block",
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {player.name}
                      </b>
                      <strong
                        style={{
                          display: "block",
                          fontSize: place === 1 ? 27 : 21,
                        }}
                      >
                        {player.score}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <RankingList
                players={ranking.slice(3)}
                leaderScore={ranking[0]?.score ?? 0}
                startIndex={3}
                totalCount={ranking.length}
              />
            </>
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
            const goal = Array.isArray(challenge.goals)
              ? challenge.goals[0]
              : challenge.goals;
            const me = players.find((player) => player.user_id === user?.id);
            const progress =
              challenge.status === "COMPLETED"
                ? 100
                : Math.min(
                    100,
                    Math.max(0, ...players.map((player) => player.score)),
                  );
            return (
              <Link
                key={challenge.id}
                href={`/retos/${challenge.id}`}
                className="stitch-card"
                style={{ padding: 20, color: "inherit" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Trophy color="var(--violet)" />
                  <CategoryBadge category={challenge.category} size={44} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <b>{challenge.title}</b>
                      <MultiplierBadge
                        enabled={goal?.streak_multiplier_enabled ?? false}
                        streakDays={me?.streak_days ?? 0}
                      />
                    </div>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 16,
                  }}
                >
                  <small className="field-label muted" style={{ margin: 0 }}>
                    Progreso
                  </small>
                  <small style={{ color: "var(--violet)", fontWeight: 800 }}>
                    {progress}%
                  </small>
                </div>
                <div
                  className="wizard-progress-track"
                  style={{ height: 7, marginTop: 7 }}
                >
                  <div
                    className="wizard-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
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

      {waitingOnOthers.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <span className="eyebrow">Propuestos por ti</span>
          <div style={{ display: "grid", gap: 11, marginTop: 10 }}>
            {waitingOnOthers.map((challenge) => {
              const waitingNames = (
                challenge.challenge_participants as Player[]
              )
                .filter((player) => player.acceptance === "PENDING")
                .map(
                  (player) =>
                    player.profiles?.display_name ??
                    player.profiles?.username ??
                    "tu rival",
                );
              return (
                <article
                  key={challenge.id}
                  className="card"
                  style={{
                    padding: 18,
                    borderLeft: "5px solid var(--violet)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Clock3 color="var(--violet)" />
                  <div style={{ flex: 1 }}>
                    <b>{challenge.title}</b>
                    <small
                      className="muted"
                      style={{ display: "block", marginTop: 3 }}
                    >
                      Esperando respuesta de {waitingNames.join(", ")}.
                    </small>
                  </div>
                  {challenge.creator_id === user?.id && (
                    <DeleteChallengeButton
                      challengeId={challenge.id}
                      title={challenge.title}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section
        className="stitch-card"
        style={{
          marginTop: 28,
          padding: 22,
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderStyle: "dashed",
        }}
      >
        <span
          style={{
            width: 58,
            height: 58,
            flex: "0 0 auto",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            border: "2px dashed var(--violet)",
          }}
        >
          <UsersRound color="var(--violet)" />
        </span>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 18 }}>¡Invita a tu equipo!</b>
          <small className="muted" style={{ display: "block" }}>
            Más gente, más competitividad.
          </small>
        </div>
        <div style={{ width: 105 }}>
          <CircleInviteButton circleId={circle.id} />
        </div>
      </section>

      <section style={{ marginTop: 28, marginBottom: 12 }}>
        <span className="eyebrow">En directo</span>
        <h2 style={{ margin: "6px 0 12px" }}>Actividad del círculo</h2>
        <ActivityFeed
          activities={
            (activities ?? []) as unknown as React.ComponentProps<
              typeof ActivityFeed
            >["activities"]
          }
          currentUserId={user?.id ?? ""}
        />
      </section>
    </main>
  );
}
