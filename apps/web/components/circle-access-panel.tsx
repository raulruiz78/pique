"use client";
import { Check, Globe2, LockKeyhole, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Request = {
  id: string;
  profiles?: { display_name?: string; username?: string };
};
export function CircleAccessPanel({ circleId }: { circleId: string }) {
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [requests, setRequests] = useState<Request[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch(`/api/v1/circles/${circleId}/access`)
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          data: { visibility: "PRIVATE" | "PUBLIC"; requests: Request[] };
        };
        setVisibility(body.data.visibility);
        setRequests(body.data.requests);
        setReady(true);
      })
      .catch(() => undefined);
  }, [circleId]);
  if (!ready) return null;
  async function toggle() {
    const next = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    const response = await fetch(`/api/v1/circles/${circleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    });
    if (!response.ok) return toast.error("No se pudo cambiar la visibilidad.");
    setVisibility(next);
    toast.success(
      next === "PUBLIC" ? "Círculo visible en Explorar." : "Círculo privado.",
    );
  }
  async function decide(requestId: string, approve: boolean) {
    const response = await fetch(`/api/v1/circles/${circleId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, approve }),
    });
    if (!response.ok) return toast.error("No se pudo responder.");
    setRequests((items) => items.filter((item) => item.id !== requestId));
    toast.success(approve ? "Miembro admitido." : "Solicitud rechazada.");
  }
  return (
    <section className="stitch-card" style={{ padding: 18, marginTop: 18 }}>
      <button
        className="button button-secondary"
        onClick={toggle}
        style={{ width: "100%" }}
      >
        {visibility === "PUBLIC" ? <Globe2 /> : <LockKeyhole />}
        {visibility === "PUBLIC" ? "Público · requiere aprobación" : "Privado"}
      </button>
      {requests.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <span className="field-label">Solicitudes pendientes</span>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: "1px solid var(--line)",
              }}
            >
              <span style={{ flex: 1 }}>
                <b>{request.profiles?.display_name ?? "Usuario"}</b>
                <small className="muted" style={{ display: "block" }}>
                  @{request.profiles?.username}
                </small>
              </span>
              <button
                className="button button-secondary"
                aria-label="Rechazar"
                onClick={() => decide(request.id, false)}
                style={{ width: 44, minHeight: 44, padding: 0 }}
              >
                <X />
              </button>
              <button
                className="button button-lime"
                aria-label="Aprobar"
                onClick={() => decide(request.id, true)}
                style={{ width: 44, minHeight: 44, padding: 0 }}
              >
                <Check />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
