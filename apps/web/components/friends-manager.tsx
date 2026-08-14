"use client";
import { Check, LoaderCircle, Plus, X, UserRoundX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { EmptyState } from "./empty-state";

interface FriendItem {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  direction: "OUTGOING" | "INCOMING";
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_path?: string | null;
  } | null;
}

export function FriendsManager({ items }: { items: FriendItem[] }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const incoming = items.filter(
    (item) => item.status === "PENDING" && item.direction === "INCOMING",
  );
  const outgoing = items.filter(
    (item) => item.status === "PENDING" && item.direction === "OUTGOING",
  );
  const accepted = items.filter((item) => item.status === "ACCEPTED");

  async function sendRequest(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const response = await fetch("/api/v1/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    setSending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      if (body?.error?.code === "USER_NOT_FOUND")
        return toast.error("No existe ese usuario.");
      return toast.error("No se pudo enviar la solicitud.");
    }
    toast.success("Solicitud enviada.");
    setUsername("");
    router.refresh();
  }

  async function respond(id: string, response: "ACCEPTED" | "REJECTED") {
    setBusyId(id);
    const result = await fetch(`/api/v1/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    setBusyId(null);
    if (!result.ok) return toast.error("No se pudo actualizar la solicitud.");
    toast.success(
      response === "ACCEPTED" ? "Ahora sois amigos." : "Solicitud rechazada.",
    );
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    const result = await fetch(`/api/v1/friends/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!result.ok) return toast.error("No se pudo eliminar.");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 24, marginTop: 24 }}>
      <form
        onSubmit={sendRequest}
        className="card"
        style={{ padding: 18, display: "flex", gap: 10, alignItems: "end" }}
      >
        <label style={{ flex: 1 }}>
          <span className="field-label">Añadir por alias</span>
          <input
            className="field"
            placeholder="usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <button
          className="button button-primary"
          disabled={sending || !username.trim()}
        >
          {sending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
        </button>
      </form>

      {incoming.length > 0 && (
        <section>
          <h2>Solicitudes recibidas</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {incoming.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar
                  name={item.profile?.display_name ?? "Pique"}
                  size={44}
                  src={
                    item.profile?.avatar_path
                      ? `/api/v1/media/profiles/${item.profile.id}`
                      : null
                  }
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{item.profile?.display_name ?? "Usuario"}</b>
                  <small className="muted" style={{ display: "block" }}>
                    @{item.profile?.username}
                  </small>
                </div>
                <button
                  className="button button-lime"
                  style={{ minHeight: 40, width: 40, padding: 0 }}
                  disabled={busyId === item.id}
                  onClick={() => void respond(item.id, "ACCEPTED")}
                  aria-label="Aceptar"
                >
                  <Check size={18} />
                </button>
                <button
                  className="button button-secondary"
                  style={{ minHeight: 40, width: 40, padding: 0 }}
                  disabled={busyId === item.id}
                  onClick={() => void respond(item.id, "REJECTED")}
                  aria-label="Rechazar"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2>Solicitudes enviadas</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {outgoing.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar
                  name={item.profile?.display_name ?? "Pique"}
                  size={44}
                  src={
                    item.profile?.avatar_path
                      ? `/api/v1/media/profiles/${item.profile.id}`
                      : null
                  }
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{item.profile?.display_name ?? "Usuario"}</b>
                  <small className="muted" style={{ display: "block" }}>
                    Pendiente
                  </small>
                </div>
                <button
                  className="button button-secondary"
                  style={{ minHeight: 40, width: 40, padding: 0 }}
                  disabled={busyId === item.id}
                  onClick={() => void remove(item.id)}
                  aria-label="Cancelar"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Tus amigos</h2>
        {accepted.length === 0 ? (
          <EmptyState
            title="Sin amigos todavía"
            text="Añade a alguien por su alias para empezar."
          />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {accepted.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar
                  name={item.profile?.display_name ?? "Pique"}
                  size={44}
                  src={
                    item.profile?.avatar_path
                      ? `/api/v1/media/profiles/${item.profile.id}`
                      : null
                  }
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{item.profile?.display_name ?? "Usuario"}</b>
                  <small className="muted" style={{ display: "block" }}>
                    @{item.profile?.username}
                  </small>
                </div>
                <button
                  className="button button-secondary"
                  style={{ minHeight: 40, width: 40, padding: 0 }}
                  disabled={busyId === item.id}
                  onClick={() => void remove(item.id)}
                  aria-label="Eliminar amigo"
                >
                  <UserRoundX size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
