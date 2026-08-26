import { Avatar } from "@/components/avatar";
import { ImageUpload } from "@/components/image-upload";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CircleSettingsPage({
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
    .select("id,name,owner_id,avatar_path")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle || circle.owner_id !== user?.id) notFound();

  return (
    <main className="page">
      <header className="screen-header">
        <Link
          href={`/circulos/${circle.id}`}
          className="button button-secondary"
          aria-label="Volver"
          style={{ width: 48, padding: 0 }}
        >
          <ArrowLeft />
        </Link>
        <div>
          <span className="eyebrow">Solo tú lo ves así</span>
          <h1 className="display" style={{ fontSize: 30, margin: "5px 0 0" }}>
            Ajustes de {circle.name}
          </h1>
        </div>
      </header>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginTop: 30,
        }}
      >
        <ImageUpload
          endpoint={`/api/v1/circles/${circle.id}/image`}
          hasImage={Boolean(circle.avatar_path)}
          label="Foto del círculo"
          menu
        >
          <Avatar
            name={circle.name}
            size={112}
            accent="var(--lime)"
            src={
              circle.avatar_path
                ? `/api/v1/media/circles/${circle.id}?v=${encodeURIComponent(circle.avatar_path)}`
                : null
            }
          />
        </ImageUpload>
        <small className="muted">Toca la foto para cambiarla o quitarla.</small>
      </div>
    </main>
  );
}
