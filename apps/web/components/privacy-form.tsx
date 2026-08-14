"use client";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Visibility = "PRIVATE" | "FRIENDS" | "PUBLIC";

export function PrivacyForm({
  profileVisibility,
}: {
  profileVisibility: Visibility;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<Visibility>(profileVisibility);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileVisibility: value }),
    });
    setLoading(false);
    if (!response.ok) return toast.error("No se pudo guardar la privacidad.");
    toast.success("Privacidad actualizada.");
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="card"
      style={{ padding: 20, display: "grid", gap: 14 }}
    >
      <label>
        <span className="field-label">Visibilidad del perfil</span>
        <select
          className="field"
          value={value}
          onChange={(event) => setValue(event.target.value as Visibility)}
        >
          <option value="PRIVATE">Privado</option>
          <option value="FRIENDS">Solo círculos compartidos</option>
          <option value="PUBLIC">Público</option>
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
