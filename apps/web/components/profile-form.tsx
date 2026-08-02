"use client";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
export function ProfileForm({
  profile,
}: {
  profile: {
    username: string;
    display_name: string;
    timezone: string;
    locale: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const timezones = useMemo(() => {
    const fallback = [
      "Europe/Madrid",
      "Europe/Lisbon",
      "Europe/London",
      "Europe/Paris",
      "America/New_York",
      "America/Mexico_City",
      "America/Argentina/Buenos_Aires",
      "Asia/Tokyo",
    ];
    const supported =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : fallback;
    return Array.from(new Set([profile.timezone, "UTC", ...supported]));
  }, [profile.timezone]);
  const [form, setForm] = useState({
    username: profile.username,
    displayName: profile.display_name,
    timezone: profile.timezone,
    locale: profile.locale,
  });
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!response.ok) return toast.error("No se pudo guardar el perfil.");
    toast.success("Perfil actualizado.");
    router.refresh();
  }
  return (
    <form
      onSubmit={save}
      className="card"
      style={{ padding: 20, display: "grid", gap: 14 }}
    >
      <label>
        <span className="field-label">Nombre visible</span>
        <input
          className="field"
          value={form.displayName}
          onChange={(event) =>
            setForm({ ...form, displayName: event.target.value })
          }
        />
      </label>
      <label>
        <span className="field-label">Alias</span>
        <input
          className="field"
          value={form.username}
          onChange={(event) =>
            setForm({ ...form, username: event.target.value })
          }
        />
      </label>
      <label>
        <span className="field-label">Zona horaria</span>
        <select
          className="field"
          value={form.timezone}
          onChange={(event) =>
            setForm({ ...form, timezone: event.target.value })
          }
        >
          {timezones.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
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
