"use client";
import { ChevronRight, Copy, LoaderCircle, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
export function CircleManager({
  circles,
}: {
  circles: Array<{
    id: string;
    name: string;
    description?: string | null;
    memberCount: number;
    activeCount?: number;
  }>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function create() {
    if (name.length < 2) return;
    setLoading(true);
    const response = await fetch("/api/v1/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!response.ok) return toast.error("No se pudo crear el círculo.");
    setName("");
    toast.success("Círculo creado.");
    router.refresh();
  }
  async function invite(
    event: React.MouseEvent<HTMLButtonElement>,
    circleId: string,
  ) {
    event.stopPropagation();
    const response = await fetch(`/api/v1/circles/${circleId}/invites`, {
      method: "POST",
    });
    const body = (await response.json()) as { data?: { code: string } };
    if (!body.data) return toast.error("No se pudo crear la invitación.");
    await navigator.clipboard.writeText(
      `${location.origin}/unirse/${body.data.code}`,
    );
    toast.success(`Enlace copiado · Código ${body.data.code}`);
  }
  return (
    <div style={{ display: "grid", gap: 11 }}>
      {circles.map((circle) => (
        <article
          className="card"
          key={circle.id}
          role="link"
          tabIndex={0}
          aria-label={`Abrir círculo ${circle.name}`}
          onClick={() => router.push(`/circulos/${circle.id}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push(`/circulos/${circle.id}`);
            }
          }}
          style={{ padding: 14, cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "var(--lime)",
                color: "#16131d",
              }}
            >
              <Users />
            </span>
            <div style={{ flex: 1, color: "inherit", minWidth: 0 }}>
              <b>{circle.name}</b>
              <small
                className="muted"
                style={{ display: "block", marginTop: 3 }}
              >
                {circle.memberCount} miembros · {circle.activeCount ?? 0} retos
                en juego
              </small>
            </div>
            <button
              aria-label={`Invitar a ${circle.name}`}
              className="button button-secondary"
              style={{ width: 45, padding: 0 }}
              onClick={(event) => invite(event, circle.id)}
            >
              <Copy size={17} />
            </button>
            <ChevronRight color="var(--violet)" aria-hidden="true" />
          </div>
          {circle.description && (
            <p
              className="muted"
              style={{ margin: "12px 2px 2px", fontSize: 13 }}
            >
              {circle.description}
            </p>
          )}
        </article>
      ))}
      <div className="card" style={{ padding: 14, display: "flex", gap: 8 }}>
        <input
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del nuevo círculo"
        />
        <button
          aria-label="Crear círculo"
          disabled={loading}
          className="button button-primary"
          style={{ width: 50, padding: 0 }}
          onClick={create}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Plus />}
        </button>
      </div>
    </div>
  );
}
