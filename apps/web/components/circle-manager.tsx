"use client";
import {
  ChevronRight,
  Compass,
  Copy,
  LoaderCircle,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { Avatar } from "./avatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
export function CircleManager({
  circles,
  pendingCount = 0,
}: {
  pendingCount?: number;
  circles: Array<{
    id: string;
    name: string;
    description?: string | null;
    memberCount: number;
    activeCount?: number;
    isOwner: boolean;
    imageSrc?: string | null;
  }>;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [exploring, setExploring] = useState(false);
  const [publicCircles, setPublicCircles] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      member_count: number;
      active_count: number;
    }>
  >([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function explore() {
    const next = !exploring;
    setExploring(next);
    if (!next || publicCircles.length) return;
    const response = await fetch("/api/v1/circles/public");
    const body = (await response.json()) as { data?: typeof publicCircles };
    if (!response.ok)
      return toast.error("No se pudieron cargar los círculos públicos.");
    setPublicCircles(body.data ?? []);
  }

  async function join(circleId: string) {
    setJoiningId(circleId);
    const response = await fetch("/api/v1/circles/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId }),
    });
    setJoiningId(null);
    if (!response.ok) return toast.error("No se pudo completar la unión.");
    toast.success("Solicitud enviada. El creador debe aprobarla.");
    setPublicCircles((items) => items.filter((item) => item.id !== circleId));
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
  async function remove(
    event: React.MouseEvent<HTMLButtonElement>,
    circle: { id: string; name: string },
  ) {
    event.stopPropagation();
    const confirmed = window.confirm(
      `¿Eliminar “${circle.name}”? Se borrarán también sus retos, puntos e historial. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setDeletingId(circle.id);
    try {
      const response = await fetch(`/api/v1/circles/${circle.id}`, {
        method: "DELETE",
      });
      if (!response.ok) return toast.error("No se pudo eliminar el círculo.");
      setRemovedIds((current) => [...current, circle.id]);
      toast.success("Círculo eliminado.");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar el círculo.");
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <div style={{ display: "grid", gap: 11 }}>
      {pendingCount > 0 && (
        <button
          className="stitch-card"
          onClick={() => router.push("/notificaciones")}
          style={{
            padding: 22,
            minHeight: 128,
            display: "flex",
            alignItems: "center",
            gap: 16,
            textAlign: "left",
            color: "var(--ink)",
            borderColor: "var(--lime)",
            borderLeftWidth: 5,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              color: "var(--lime)",
              background: "rgb(188 255 95 / 12%)",
            }}
          >
            <Users />
          </span>
          <span style={{ flex: 1 }}>
            <b style={{ display: "block", fontSize: 20 }}>
              Tienes {pendingCount}{" "}
              {pendingCount === 1 ? "reto pendiente" : "retos pendientes"}
            </b>
            <small className="muted">
              Revisa las invitaciones y entra en juego.
            </small>
          </span>
          <ChevronRight />
        </button>
      )}
      {circles
        .filter((circle) => !removedIds.includes(circle.id))
        .map((circle) => (
          <article
            className="stitch-card"
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
            style={{ padding: 24, cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {circle.imageSrc ? (
                <Avatar
                  name={circle.name}
                  src={circle.imageSrc}
                  size={56}
                  accent="var(--lime)"
                />
              ) : (
                <span
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: 18,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--lime)",
                    color: "#16131d",
                  }}
                >
                  <Users />
                </span>
              )}
              <div style={{ flex: 1, color: "inherit", minWidth: 0 }}>
                <b style={{ fontSize: 20 }}>{circle.name}</b>
                <small
                  className="muted"
                  style={{ display: "block", marginTop: 2 }}
                >
                  {circle.memberCount} miembros
                </small>
              </div>
              <button
                aria-label={`Invitar a ${circle.name}`}
                className="button button-secondary"
                style={{ width: 42, padding: 0 }}
                onClick={(event) => invite(event, circle.id)}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Copy size={16} />
              </button>
              {circle.isOwner && (
                <button
                  aria-label={`Eliminar ${circle.name}`}
                  disabled={deletingId === circle.id}
                  onClick={(event) => remove(event, circle)}
                  onKeyDown={(event) => event.stopPropagation()}
                  style={{
                    width: 42,
                    height: 42,
                    padding: 0,
                    flexShrink: 0,
                    border: 0,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--danger)",
                    color: "#690005",
                    cursor: "pointer",
                  }}
                >
                  {deletingId === circle.id ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
            {circle.description && (
              <p
                className="muted"
                style={{ margin: "14px 2px 0", fontSize: 13 }}
              >
                {circle.description}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
              }}
            >
              <span
                className="muted"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Zap size={16} color="var(--lime)" />
                {circle.activeCount ?? 0}{" "}
                {circle.activeCount === 1 ? "reto en juego" : "retos en juego"}
              </span>
              <span
                className="pill"
                style={{
                  background:
                    (circle.activeCount ?? 0) > 0
                      ? "rgb(188 255 95 / 14%)"
                      : "var(--surface-high)",
                  color:
                    (circle.activeCount ?? 0) > 0
                      ? "var(--lime)"
                      : "var(--muted)",
                }}
              >
                {(circle.activeCount ?? 0) > 0
                  ? circle.activeCount === 1
                    ? "1 ACTIVO"
                    : `${circle.activeCount} ACTIVOS`
                  : "SIN RETOS"}
              </span>
            </div>
          </article>
        ))}
      <button
        className="stitch-card"
        onClick={explore}
        style={{
          minHeight: 150,
          padding: 24,
          borderStyle: "dashed",
          color: "var(--ink)",
          cursor: "pointer",
        }}
      >
        <Compass color="var(--violet)" />
        <b style={{ display: "block", fontSize: 20, marginTop: 12 }}>
          ¿Buscas motivación?
        </b>
        <span className="muted">
          Explora círculos públicos y únete a la comunidad.
        </span>
      </button>
      {exploring && (
        <section style={{ display: "grid", gap: 10 }}>
          <span className="eyebrow">Explorar círculos</span>
          {publicCircles.length === 0 ? (
            <p className="muted">
              No hay círculos públicos disponibles ahora mismo.
            </p>
          ) : (
            publicCircles.map((circle) => (
              <article
                key={circle.id}
                className="stitch-card"
                style={{
                  padding: 18,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    display: "grid",
                    placeItems: "center",
                    background: "rgb(188 255 95 / 12%)",
                  }}
                >
                  <Users />
                </span>
                <div style={{ flex: 1 }}>
                  <b>{circle.name}</b>
                  <small className="muted" style={{ display: "block" }}>
                    {circle.member_count} miembros · {circle.active_count} retos
                  </small>
                </div>
                <button
                  className="button button-primary"
                  disabled={joiningId === circle.id}
                  onClick={() => join(circle.id)}
                  style={{ minHeight: 44, paddingInline: 14 }}
                >
                  {joiningId === circle.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    "Unirme"
                  )}
                </button>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}
