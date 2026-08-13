"use client";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { usePushSubscription } from "@/hooks/use-push-subscription";

interface NotificationPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
  quietStart: string;
  quietEnd: string;
}

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(preferences);
  const { status, subscribe, unsubscribe } = usePushSubscription();

  async function togglePush(enabled: boolean) {
    if (enabled) {
      const subscribed = await subscribe();
      if (!subscribed) {
        if (status === "denied")
          toast.error("Permiso de notificaciones denegado.");
        else if (status === "unsupported")
          toast.error("Este navegador no admite notificaciones push.");
        else toast.error("No se pudo activar el push.");
        return;
      }
    } else {
      await unsubscribe();
    }
    setForm((current) => ({ ...current, push: enabled }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPreferences: form }),
    });
    setLoading(false);
    if (!response.ok)
      return toast.error("No se pudieron guardar las preferencias.");
    toast.success("Preferencias actualizadas.");
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="card"
      style={{ padding: 20, display: "grid", gap: 14 }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="field-label" style={{ margin: 0 }}>
          Avisos en la app
        </span>
        <input
          type="checkbox"
          checked={form.inApp}
          onChange={(event) =>
            setForm({ ...form, inApp: event.target.checked })
          }
        />
      </label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="field-label" style={{ margin: 0 }}>
          Notificaciones push
        </span>
        <input
          type="checkbox"
          checked={form.push}
          disabled={status === "subscribing"}
          onChange={(event) => void togglePush(event.target.checked)}
        />
      </label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="field-label" style={{ margin: 0 }}>
          Resúmenes por correo
        </span>
        <input
          type="checkbox"
          checked={form.email}
          onChange={(event) =>
            setForm({ ...form, email: event.target.checked })
          }
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          <span className="field-label">Horas silenciosas desde</span>
          <input
            type="time"
            className="field"
            value={form.quietStart}
            onChange={(event) =>
              setForm({ ...form, quietStart: event.target.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Hasta</span>
          <input
            type="time"
            className="field"
            value={form.quietEnd}
            onChange={(event) =>
              setForm({ ...form, quietEnd: event.target.value })
            }
          />
        </label>
      </div>
      <button className="button button-primary" disabled={loading}>
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        Guardar cambios
      </button>
    </form>
  );
}
