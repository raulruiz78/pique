import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { ProfileForm } from "@/components/profile-form";
import { ImageUpload } from "@/components/image-upload";
import { SignOutButton } from "@/components/sign-out";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Crown,
  Dumbbell,
  Eye,
  Flame,
  Medal,
  Settings,
  ShieldCheck,
  Star,
  Target,
  UsersRound,
} from "lucide-react";
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
    .select(
      "username,display_name,avatar_path,timezone,locale,profile_visibility,total_points,current_streak,notification_preferences",
    )
    .eq("id", user!.id)
    .single();
  const value = profile.data;
  const [circleCount, challengeCount] = await Promise.all([
    supabase
      .from("circle_members")
      .select("circle_id", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("challenge_participants")
      .select("challenge_id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("acceptance", "ACCEPTED"),
  ]);
  const points = value?.total_points ?? 0;
  const streak = value?.current_streak ?? 0;
  const level = Math.floor(points / 500) + 1;
  const tierNames = [
    "Novato",
    "Contendiente",
    "Rival",
    "Pro",
    "Élite",
    "Leyenda",
  ];
  const tier =
    tierNames[Math.min(tierNames.length - 1, Math.floor((level - 1) / 3))];
  const levelProgress = points % 500;
  return (
    <main className="page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <h1 style={{ color: "var(--violet)", fontSize: 25, margin: 0 }}>
          Perfil
        </h1>
        <Settings color="var(--violet)" />
      </div>
      <header
        style={{
          display: "grid",
          justifyItems: "center",
          textAlign: "center",
          gap: 14,
          paddingTop: 14,
        }}
      >
        <ImageUpload
          endpoint="/api/v1/users/me/avatar"
          hasImage={Boolean(value?.avatar_path)}
          label="Foto de perfil"
        >
          <Avatar
            name={value?.display_name ?? "Pique"}
            size={126}
            accent="var(--violet)"
            src={
              value?.avatar_path
                ? `/api/v1/media/profiles/${user!.id}?v=${encodeURIComponent(value.avatar_path)}`
                : null
            }
          />
        </ImageUpload>
        <div>
          <h1 className="display" style={{ fontSize: 31, margin: "8px 0 5px" }}>
            {value?.display_name}
          </h1>
          <span className="muted">@{value?.username}</span>
        </div>
      </header>
      <section className="stitch-card" style={{ padding: 20, marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
          }}
        >
          <div>
            <span className="field-label muted">Tu nivel</span>
            <strong
              className="display"
              style={{ color: "var(--violet)", fontSize: 28 }}
            >
              {tier} {level}
            </strong>
          </div>
          <Crown color="var(--lime)" size={32} />
        </div>
        <div className="wizard-progress-track" style={{ marginTop: 16 }}>
          <div
            className="wizard-progress-fill"
            style={{
              width: `${levelProgress / 5}%`,
              background: "var(--lime)",
            }}
          />
        </div>
        <small className="muted" style={{ display: "block", marginTop: 8 }}>
          {500 - levelProgress} puntos para el nivel {level + 1}
        </small>
      </section>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          margin: "24px 0",
        }}
      >
        <div
          className="stitch-card"
          style={{ padding: 20, textAlign: "center" }}
        >
          <small className="field-label muted">Racha actual</small>
          <strong
            className="display"
            style={{ fontSize: 31, color: "var(--lime)" }}
          >
            {streak} días
          </strong>
        </div>
        <div
          className="stitch-card"
          style={{ padding: 20, textAlign: "center" }}
        >
          <small className="field-label muted">Puntos totales</small>
          <strong
            className="display"
            style={{ fontSize: 31, color: "var(--violet)" }}
          >
            {points.toLocaleString("es")}
          </strong>
          <small className="muted" style={{ display: "block", marginTop: 6 }}>
            Nivel {level}
          </small>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <h2>Logros y medallas</h2>
        <div className="achievement-scroll">
          {[
            [Medal, "Primer pique", points > 0, "Consigue tus primeros puntos"],
            [Target, "Centurión", points >= 100, "Alcanza 100 puntos"],
            [Dumbbell, "Bestia", points >= 500, "Alcanza 500 puntos"],
            [Star, "Imparable", points >= 2500, "Alcanza 2.500 puntos"],
            [Flame, "En llamas", streak >= 7, "Mantén una racha de 7 días"],
            [Crown, "Leyenda", streak >= 30, "Mantén una racha de 30 días"],
            [
              UsersRound,
              "Sociable",
              (circleCount.count ?? 0) >= 3,
              "Participa en 3 círculos",
            ],
            [
              BookOpen,
              "Veterano",
              (challengeCount.count ?? 0) >= 10,
              "Acepta 10 retos",
            ],
          ].map(([Icon, label, unlocked, description]) => {
            const Comp = Icon as typeof Medal;
            return (
              <div
                key={String(label)}
                className="stitch-card"
                style={{
                  padding: 16,
                  minWidth: 140,
                  textAlign: "center",
                  opacity: unlocked ? 1 : 0.38,
                }}
              >
                <Comp color={unlocked ? "var(--lime)" : "var(--muted)"} />
                <small className="field-label" style={{ margin: "12px 0 0" }}>
                  {String(label)}
                </small>
                <small
                  className="muted"
                  style={{ display: "block", marginTop: 6 }}
                >
                  {String(description)}
                </small>
              </div>
            );
          })}
        </div>
      </section>
      <h2>Tu perfil</h2>
      {value && <ProfileForm profile={value} />}
      <h2 style={{ marginTop: 30 }}>Notificaciones</h2>
      {value && (
        <NotificationPreferencesForm
          preferences={
            value.notification_preferences as {
              inApp: boolean;
              push: boolean;
              email: boolean;
              quietStart: string;
              quietEnd: string;
            }
          }
        />
      )}
      <h2 style={{ marginTop: 30 }}>Configuración</h2>
      <div className="stitch-card" style={{ padding: "4px 17px" }}>
        {[
          [Eye, "Privacidad del perfil"],
          [Bell, "Notificaciones y horas silenciosas"],
          [ShieldCheck, "Seguridad, bloqueos y denuncias"],
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
              <span style={{ flex: 1, textAlign: "left" }}>
                {String(label)}
              </span>
              <ChevronRight size={18} />
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
