import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/unirse/${encodeURIComponent(code)}`);
  const { data, error } = await supabase.rpc("accept_circle_invite", {
    invite_code: code,
  });
  if (error)
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
          <h1>Este enlace ya no vale</h1>
          <p className="muted">Pide uno nuevo a quien creó el círculo.</p>
        </div>
      </main>
    );
  redirect(`/circulos/${data}`);
}
