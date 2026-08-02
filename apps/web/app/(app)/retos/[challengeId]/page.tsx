import { Avatar } from "@/components/avatar";
import { ChallengeActions } from "@/components/challenge-actions";
import { EmptyState } from "@/components/empty-state";
import { createServerSupabase } from "@/lib/supabase/server";
import { CalendarDays, Camera, ShieldCheck, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
export default async function ChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createServerSupabase();
  if (!supabase)
    return (
      <main className="page">
        <EmptyState
          title="Sin conexión"
          text="Configura Supabase para consultar el reto."
        />
      </main>
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("challenges")
    .select(
      "*,goals(*),challenge_participants(user_id,acceptance,score,current_streak,profiles(display_name,username,avatar_path)),penalties(description,status),rewards(description,status)",
    )
    .eq("id", challengeId)
    .maybeSingle();
  if (!data) notFound();
  const self = data.challenge_participants.find(
    (item: { user_id: string }) => item.user_id === user?.id,
  );
  return (
    <main className="page">
      <header>
        <span className="pill pill-violet">
          {data.status.replaceAll("_", " ")}
        </span>
        <h1 className="display" style={{ fontSize: 44, margin: "13px 0 8px" }}>
          {data.title}
        </h1>
        <p className="muted" style={{ lineHeight: 1.5 }}>
          {data.description}
        </p>
      </header>
      {data.status === "PENDING_ACCEPTANCE" &&
        self?.acceptance === "PENDING" && (
          <div
            className="card"
            style={{
              padding: 18,
              margin: "22px 0",
              background: "rgb(200 255 55 / 14%)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Te han retado.</h2>
            <p className="muted">
              Lee las reglas: al aceptar ya no se cambian unilateralmente.
            </p>
            <ChallengeActions challengeId={challengeId} />
          </div>
        )}
      <section className="card" style={{ padding: 20, margin: "22px 0" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Row
            Icon={CalendarDays}
            label="Fechas"
            value={`${new Date(data.start_at).toLocaleDateString("es")} — ${new Date(data.end_at).toLocaleDateString("es")}`}
          />
          <Row
            Icon={Trophy}
            label="Puntos"
            value={`${data.goals[0]?.base_points ?? 0} por check-in`}
          />
          <Row
            Icon={Camera}
            label="Prueba"
            value={data.evidence_required ? "Foto privada" : "No obligatoria"}
          />
          <Row
            Icon={ShieldCheck}
            label="Validación"
            value={
              data.validation_type === "PEER_REVIEW"
                ? "Por el rival"
                : "Automática"
            }
          />
        </div>
      </section>
      <h2>Marcador</h2>
      <div className="card" style={{ padding: "5px 18px" }}>
        {[...data.challenge_participants]
          .sort((a, b) => b.score - a.score)
          .map((participant, index) => (
            <div
              key={participant.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom:
                  index < data.challenge_participants.length - 1
                    ? "1px solid var(--line)"
                    : 0,
              }}
            >
              <b
                style={{ color: index === 0 ? "var(--gold)" : "var(--muted)" }}
              >
                #{index + 1}
              </b>
              <Avatar
                name={participant.profiles?.display_name ?? "Jugador"}
                size={40}
                accent={index === 0 ? "var(--lime)" : "var(--violet)"}
                src={
                  participant.profiles?.avatar_path
                    ? `/api/v1/media/profiles/${participant.user_id}`
                    : null
                }
              />
              <div style={{ flex: 1 }}>
                <b>{participant.profiles?.display_name}</b>
                <small className="muted" style={{ display: "block" }}>
                  {participant.acceptance.toLowerCase()}
                </small>
              </div>
              <strong>{participant.score} pt</strong>
            </div>
          ))}
      </div>
      <h2 style={{ marginTop: 28 }}>Reglas aceptadas</h2>
      <div className="card" style={{ padding: 20 }}>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, margin: 0 }}>
          {data.rules ||
            "Cumplir el objetivo dentro de su ventana y aportar la evidencia acordada."}
        </p>
      </div>
      {data.penalties[0] && (
        <>
          <h2 style={{ marginTop: 28 }}>Lo que hay en juego</h2>
          <div
            className="card"
            style={{ padding: 20, borderLeft: "5px solid var(--coral)" }}
          >
            <b>{data.penalties[0].description}</b>
            <p className="muted" style={{ margin: "7px 0 0", fontSize: 13 }}>
              Consecuencia no monetaria, segura y consentida.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
function Row({
  Icon,
  label,
  value,
}: {
  Icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Icon size={19} color="var(--violet)" />
      <span className="muted" style={{ width: 80, fontSize: 13 }}>
        {label}
      </span>
      <b style={{ flex: 1, textAlign: "right" }}>{value}</b>
    </div>
  );
}
