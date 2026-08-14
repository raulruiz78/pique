import { Avatar } from "@/components/avatar";
import { ChallengeActions } from "@/components/challenge-actions";
import { CategoryBadge, categoryMeta } from "@/components/challenge-category";
import { EmptyState } from "@/components/empty-state";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  CalendarDays,
  Camera,
  Repeat,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const WEEK_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DAY_LETTERS: Record<string, string> = {
  MO: "L",
  TU: "M",
  WE: "X",
  TH: "J",
  FR: "V",
  SA: "S",
  SU: "D",
};

type Rhythm =
  | { kind: "multiple"; badge: string; headline: string }
  | { kind: "flexible"; badge: string; headline: string }
  | { kind: "fixed"; badge: string; headline: string; activeDays: string[] };

function describeRhythm(recurrence: string): Rhythm {
  const parts = Object.fromEntries(
    recurrence
      .split(";")
      .map((part) => part.split("="))
      .filter(([key]) => key),
  ) as Record<string, string>;

  if (parts.DAILYCOUNT) {
    const count = Number(parts.DAILYCOUNT);
    return {
      kind: "multiple",
      badge: "MÚLTIPLE AL DÍA",
      headline: `${count} ${count === 1 ? "vez" : "veces"} cada día`,
    };
  }
  if (parts.FLEX) {
    const count = Number(parts.FLEX);
    return {
      kind: "flexible",
      badge: "FLEXIBLE",
      headline: `${count} ${count === 1 ? "vez" : "veces"} por semana, vosotros elegís cuándo`,
    };
  }
  if (parts.FREQ === "DAILY") {
    return {
      kind: "fixed",
      badge: "FIJO",
      headline: "Todos los días",
      activeDays: WEEK_CODES,
    };
  }
  if (parts.BYDAY) {
    const activeDays = parts.BYDAY.split(",").filter(
      (code): code is string => Boolean(code) && code in DAY_LETTERS,
    );
    if (activeDays.length === WEEK_CODES.length) {
      return {
        kind: "fixed",
        badge: "FIJO",
        headline: "Todos los días",
        activeDays: WEEK_CODES,
      };
    }
    return {
      kind: "fixed",
      badge: "FIJO",
      headline:
        activeDays.length === 1
          ? "Un día fijo a la semana"
          : `${activeDays.length} días fijos a la semana`,
      activeDays,
    };
  }
  return {
    kind: "fixed",
    badge: "FIJO",
    headline: "Ritmo fijo",
    activeDays: [],
  };
}
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
      <header style={{ marginBottom: 28 }}>
        <CategoryBadge category={data.category} size={68} />
        <span className="pill pill-violet">
          {data.status.replaceAll("_", " ")}
        </span>
        <h1 className="display screen-title">{data.title}</h1>
        <p className="muted" style={{ lineHeight: 1.5 }}>
          {data.description}
        </p>
        <span className="eyebrow">{categoryMeta(data.category).label}</span>
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
      <RhythmCard rhythm={describeRhythm(data.goals[0]?.recurrence ?? "")} />
      <section className="metric-grid" style={{ margin: "22px 0" }}>
        <div className="stitch-card metric-card">
          <Row
            Icon={CalendarDays}
            label="Fechas"
            value={`${new Date(data.start_at).toLocaleDateString("es")} — ${new Date(data.end_at).toLocaleDateString("es")}`}
          />
        </div>
        <div className="stitch-card metric-card">
          <Row
            Icon={Trophy}
            label="Puntos"
            value={`${data.goals[0]?.base_points ?? 0} por check-in`}
          />
        </div>
        <div className="stitch-card metric-card">
          <Row
            Icon={Camera}
            label="Prueba"
            value={data.evidence_required ? "Foto privada" : "No obligatoria"}
          />
        </div>
        <div className="stitch-card metric-card">
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
      <div className="stitch-card" style={{ padding: "5px 18px" }}>
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
      <div className="stitch-card" style={{ padding: 24 }}>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, margin: 0 }}>
          {data.rules ||
            "Cumplir el objetivo dentro de su ventana y aportar la evidencia acordada."}
        </p>
      </div>
      {data.penalties[0] && (
        <>
          <h2 style={{ marginTop: 28 }}>Lo que hay en juego</h2>
          <div
            className="stitch-card"
            style={{
              padding: 24,
              border: "1px solid #813b3b",
              background: "#341a1c",
            }}
          >
            <b>{data.penalties[0].description}</b>
            <p className="muted" style={{ margin: "7px 0 0", fontSize: 13 }}>
              Lo que se juega aquí lo decidís vosotros.
            </p>
          </div>
        </>
      )}
      {data.status === "ACTIVE" && (
        <Link
          href="/hoy"
          className="button button-primary"
          style={{ width: "100%", marginTop: 20 }}
        >
          <Camera size={19} /> Subir evidencia
        </Link>
      )}
    </main>
  );
}
function RhythmCard({ rhythm }: { rhythm: Rhythm }) {
  return (
    <section className="stitch-card" style={{ padding: 20, margin: "22px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Repeat size={20} color="var(--violet)" />
        <span className="pill pill-violet">{rhythm.badge}</span>
      </div>
      <b style={{ fontSize: 18, display: "block" }}>{rhythm.headline}</b>
      {rhythm.kind === "fixed" && rhythm.activeDays.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {WEEK_CODES.map((code) => {
            const active = rhythm.activeDays.includes(code);
            return (
              <span
                key={code}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  background: active ? "var(--lime)" : "var(--surface-high)",
                  color: active ? "#16131d" : "var(--muted)",
                }}
              >
                {DAY_LETTERS[code]}
              </span>
            );
          })}
        </div>
      )}
    </section>
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
    <div
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      <Icon size={25} color="var(--violet)" />
      <span
        className="muted"
        style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 800 }}
      >
        {label}
      </span>
      <b style={{ fontSize: 18 }}>{value}</b>
    </div>
  );
}
