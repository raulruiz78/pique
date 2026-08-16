import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div className="card" style={{ padding: 28, textAlign: "center" }}>
        {children}
      </div>
    </main>
  );
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");
  const user = await getCurrentUser();

  if (!user) {
    const { data: preview } = (await supabase
      .rpc("preview_circle_invite", { invite_code: code })
      .maybeSingle()) as {
      data: { circle_name: string; inviter_name: string | null } | null;
    };
    if (!preview)
      return (
        <InviteShell>
          <h1>Este enlace ya no vale</h1>
          <p className="muted">Pide uno nuevo a quien creó el círculo.</p>
        </InviteShell>
      );
    const next = `/unirse/${encodeURIComponent(code)}`;
    return (
      <InviteShell>
        <span
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 18px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgb(200 255 55 / 14%)",
          }}
        >
          <Users color="var(--lime)" size={28} />
        </span>
        <span className="eyebrow">Te han invitado</span>
        <h1 className="display" style={{ fontSize: 30, margin: "8px 0 6px" }}>
          {preview.circle_name}
        </h1>
        <p className="muted" style={{ margin: "0 0 26px", lineHeight: 1.5 }}>
          {preview.inviter_name ?? "Alguien"} te reta a unirte al pique.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            href={`/registro?next=${encodeURIComponent(next)}`}
            className="button button-primary"
            style={{ width: "100%" }}
          >
            <Sparkles size={18} />
            Crear cuenta y unirme
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="button button-secondary"
            style={{ width: "100%" }}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </InviteShell>
    );
  }

  const { data, error } = await supabase.rpc("accept_circle_invite", {
    invite_code: code,
  });
  if (error)
    return (
      <InviteShell>
        <h1>Este enlace ya no vale</h1>
        <p className="muted">Pide uno nuevo a quien creó el círculo.</p>
      </InviteShell>
    );
  redirect(`/circulos/${data}`);
}
