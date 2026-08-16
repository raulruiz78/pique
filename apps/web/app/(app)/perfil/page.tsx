import { Avatar } from "@/components/avatar";
import { AchievementScroll } from "@/components/achievement-scroll";
import { EmptyState } from "@/components/empty-state";
import { ImageUpload } from "@/components/image-upload";
import { LevelProgress } from "@/components/level-progress";
import { SignOutButton } from "@/components/sign-out";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import Link from "next/link";
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
  const user = await getCurrentUser();
  const profile = await supabase
    .from("profiles")
    .select(
      "username,display_name,avatar_path,total_points,current_streak,best_streak",
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
  const bestStreak = Math.max(value?.best_streak ?? 0, streak);
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
    tierNames[Math.min(tierNames.length - 1, Math.floor((level - 1) / 3))] ??
    tierNames[0]!;
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
        <Link
          href="/perfil/editar"
          aria-label="Editar perfil"
          className="button button-secondary"
          style={{ width: 42, height: 42, padding: 0 }}
        >
          <Settings size={18} />
        </Link>
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
      <LevelProgress
        userId={user!.id}
        points={points}
        level={level}
        tier={tier}
      />
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
          <small className="muted" style={{ display: "block", marginTop: 6 }}>
            Récord: {bestStreak} días
          </small>
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
        <AchievementScroll
          userId={user!.id}
          achievements={[
            {
              key: "first-point",
              icon: Medal,
              label: "Primer pique",
              unlocked: points > 0,
              description: "Consigue tus primeros puntos",
            },
            {
              key: "centurion",
              icon: Target,
              label: "Centurión",
              unlocked: points >= 100,
              description: "Alcanza 100 puntos",
            },
            {
              key: "beast",
              icon: Dumbbell,
              label: "Bestia",
              unlocked: points >= 500,
              description: "Alcanza 500 puntos",
            },
            {
              key: "unstoppable",
              icon: Star,
              label: "Imparable",
              unlocked: points >= 2500,
              description: "Alcanza 2.500 puntos",
            },
            {
              key: "on-fire",
              icon: Flame,
              label: "En llamas",
              unlocked: streak >= 7,
              description: "Mantén una racha de 7 días",
            },
            {
              key: "legend",
              icon: Crown,
              label: "Leyenda",
              unlocked: streak >= 30,
              description: "Mantén una racha de 30 días",
            },
            {
              key: "sociable",
              icon: UsersRound,
              label: "Sociable",
              unlocked: (circleCount.count ?? 0) >= 3,
              description: "Participa en 3 círculos",
            },
            {
              key: "veteran",
              icon: BookOpen,
              label: "Veterano",
              unlocked: (challengeCount.count ?? 0) >= 10,
              description: "Acepta 10 retos",
            },
          ]}
        />
      </section>
      <h2 style={{ marginTop: 30 }}>Configuración</h2>
      <div className="stitch-card" style={{ padding: "4px 17px" }}>
        {(
          [
            { icon: Settings, label: "Editar perfil", href: "/perfil/editar" },
            { icon: UsersRound, label: "Amigos", href: "/amigos" },
            {
              icon: Eye,
              label: "Privacidad del perfil",
              href: "/perfil/privacidad",
            },
            {
              icon: Bell,
              label: "Notificaciones y horas silenciosas",
              href: "/perfil/notificaciones",
            },
            { icon: ShieldCheck, label: "Seguridad, bloqueos y denuncias" },
          ] as const
        ).map((item, index, array) => {
          const Icon = item.icon;
          const style = {
            width: "100%",
            justifyContent: "start" as const,
            padding: "0 3px",
            borderRadius: 0,
            background: "transparent",
            color: "var(--ink)",
            borderBottom:
              index < array.length - 1 ? "1px solid var(--line)" : 0,
          };
          const content = (
            <>
              <Icon size={18} color="var(--violet)" />
              <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              <ChevronRight size={18} />
            </>
          );
          return "href" in item ? (
            <Link
              key={item.label}
              href={item.href}
              className="button"
              style={style}
            >
              {content}
            </Link>
          ) : (
            <button key={item.label} className="button" style={style}>
              {content}
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
