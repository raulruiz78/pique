"use client";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  challengeCategories,
  type ChallengeCategory,
} from "./challenge-category";

interface Member {
  user_id: string;
  profiles: { display_name?: string; username?: string };
}
interface Circle {
  id: string;
  name: string;
  circle_members: Member[];
}
const weekdays = [
  { value: "MO", label: "L", name: "Lunes" },
  { value: "TU", label: "M", name: "Martes" },
  { value: "WE", label: "X", name: "Miércoles" },
  { value: "TH", label: "J", name: "Jueves" },
  { value: "FR", label: "V", name: "Viernes" },
  { value: "SA", label: "S", name: "Sábado" },
  { value: "SU", label: "D", name: "Domingo" },
] as const;
export function ChallengeWizard({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [form, setForm] = useState({
    circleId: "",
    title: "",
    category: "TRAINING" as ChallengeCategory,
    description: "",
    type: "FREQUENCY",
    startDate,
    endDate,
    scheduleMode: "fixed" as "fixed" | "flexible" | "dailyMultiple",
    days: "MO,WE,FR",
    weeklyTarget: 3,
    dailyTarget: 2,
    points: "10",
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor invita a cenar",
    participantIds: [] as string[],
  });
  useEffect(() => {
    fetch("/api/v1/circles")
      .then(async (response) => {
        if (response.ok) {
          const body = (await response.json()) as { data: Circle[] };
          setCircles(body.data);
          const first = body.data[0];
          if (first)
            setForm((current) => ({
              ...current,
              circleId: first.id,
              participantIds: first.circle_members.map(
                (member) => member.user_id,
              ),
            }));
        }
      })
      .catch(() => undefined);
  }, []);
  const circle = circles.find((item) => item.id === form.circleId);
  const ready = useMemo(
    () =>
      form.title.length >= 3 &&
      form.circleId &&
      form.participantIds.length >= 2 &&
      Number(form.points) >= 1 &&
      Number(form.points) <= 10_000,
    [form],
  );
  function chooseCategory(category: ChallengeCategory) {
    setForm((current) => ({
      ...current,
      category,
    }));
    setStep(2);
  }
  function toggleDay(day: (typeof weekdays)[number]["value"]) {
    const selected = form.days.split(",").filter(Boolean);
    const next = selected.includes(day)
      ? selected.filter((value) => value !== day)
      : weekdays
          .map(({ value }) => value)
          .filter((value) => [...selected, day].includes(value));
    if (next.length > 0) setForm({ ...form, days: next.join(",") });
  }
  async function submit() {
    if (!ready) return toast.error("Revisa título, círculo y participantes.");
    setLoading(true);
    const response = await fetch("/api/v1/challenges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        circleId: form.circleId,
        title: form.title,
        category: form.category,
        description: form.description,
        type: form.type,
        // Si el inicio sigue siendo hoy (el valor por defecto), usamos el
        // instante actual: fijarlo a las 08:00 dejaba el reto "programado"
        // en vez de "activo" hasta esa hora, aunque todos lo aceptaran antes.
        startAt: (form.startDate === startDate
          ? new Date()
          : new Date(`${form.startDate}T08:00:00`)
        ).toISOString(),
        endAt: new Date(`${form.endDate}T23:59:59`).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recurrence:
          form.scheduleMode === "flexible"
            ? `FREQ=WEEKLY;FLEX=${form.weeklyTarget}`
            : form.scheduleMode === "dailyMultiple"
              ? `FREQ=DAILY;DAILYCOUNT=${form.dailyTarget}`
              : `FREQ=WEEKLY;BYDAY=${form.days}`,
        points: Number(form.points),
        evidenceRequired: form.evidenceRequired,
        validationType: form.validationType,
        consequence: form.consequence,
        participantIds: form.participantIds,
      }),
    });
    const body = (await response.json()) as {
      data?: { id: string };
      error?: { message: string };
    };
    setLoading(false);
    if (!response.ok || !body.data)
      return toast.error(body.error?.message ?? "No se pudo crear el reto.");
    toast.success("Reto enviado. Falta que todos acepten.");
    router.push(`/retos/${body.data.id}`);
    router.refresh();
  }
  return (
    <div>
      <div className="wizard-progress" aria-label={`Paso ${step} de 4`}>
        <div className="wizard-progress-labels">
          <span>Paso {step} de 4</span>
          <span>
            {step === 4 ? "Listo para enviar" : `${step * 25}% completado`}
          </span>
        </div>
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>
      {step === 1 && (
        <section>
          <h2 className="display" style={{ fontSize: 40, margin: "8px 0 8px" }}>
            ¿A qué os vais a picar?
          </h2>
          <p
            className="muted"
            style={{ fontSize: 20, lineHeight: 1.45, margin: "0 0 30px" }}
          >
            Elige una categoría. Solo define su identidad visual; las reglas las
            marcas tú.
          </p>
          <div className="template-grid">
            {challengeCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => chooseCategory(category.value)}
                className="stitch-card template-card"
              >
                <span className="template-icon">{category.emoji}</span>
                <b style={{ display: "block", fontSize: 25, lineHeight: 1.15 }}>
                  {category.label}
                </b>
                <small className="muted">{category.examples}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 2 && (
        <section>
          <h2
            className="display"
            style={{ fontSize: 38, margin: "8px 0 28px" }}
          >
            Que quede clarísimo.
          </h2>
          <div style={{ display: "grid", gap: 15 }}>
            <label>
              <span className="field-label">Título</span>
              <input
                className="field"
                maxLength={80}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />
            </label>
            <label>
              <span className="field-label">Descripción y reglas</span>
              <textarea
                className="field"
                rows={4}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Qué cuenta, qué no y cómo se resuelve una duda."
              />
            </label>
            <label>
              <span className="field-label">Círculo</span>
              <select
                className="field"
                value={form.circleId}
                onChange={(event) => {
                  const selected = circles.find(
                    (item) => item.id === event.target.value,
                  );
                  setForm({
                    ...form,
                    circleId: event.target.value,
                    participantIds:
                      selected?.circle_members.map(
                        (member) => member.user_id,
                      ) ?? [],
                  });
                }}
              >
                <option value="">Selecciona un círculo</option>
                {circles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {circles.length === 0 && (
              <p className="muted">
                Primero crea un círculo desde tu perfil e invita a otra persona.
              </p>
            )}
            <div>
              <span className="field-label">Participantes</span>
              <div className="stitch-card" style={{ padding: 12 }}>
                {circle?.circle_members.map((member) => (
                  <label
                    key={member.user_id}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: 8,
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.participantIds.includes(member.user_id)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          participantIds: event.target.checked
                            ? [...form.participantIds, member.user_id]
                            : form.participantIds.filter(
                                (id) => id !== member.user_id,
                              ),
                        })
                      }
                    />
                    <Users size={17} />
                    <span>
                      {member.profiles?.display_name ??
                        member.profiles?.username}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      {step === 3 && (
        <section>
          <h2
            className="display"
            style={{ fontSize: 38, margin: "8px 0 28px" }}
          >
            Marca el terreno.
          </h2>
          <div style={{ display: "grid", gap: 15 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <label>
                <span className="field-label">Empieza</span>
                <input
                  className="field"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="field-label">Termina</span>
                <input
                  className="field"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </label>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="field-label">Ritmo semanal</legend>
              <div
                className="stitch-card"
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                {(
                  [
                    ["fixed", "Días fijos"],
                    ["flexible", "Flexible"],
                    ["dailyMultiple", "Varias al día"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = form.scheduleMode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      className="choice-card"
                      onClick={() => setForm({ ...form, scheduleMode: value })}
                    >
                      <span className="choice-dot" />
                      <span>
                        <b>{label}</b>
                        <small className="muted" style={{ display: "block" }}>
                          {value === "fixed"
                            ? "Siempre los mismos días."
                            : value === "flexible"
                              ? "Tú eliges cuándo, cumple el total."
                              : "Para los que van a por todas."}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.scheduleMode === "fixed" ? (
                <div
                  role="group"
                  aria-label="Días del reto"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 7,
                  }}
                >
                  {weekdays.map((day) => {
                    const selected = form.days.split(",").includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={selected}
                        aria-label={day.name}
                        onClick={() => toggleDay(day.value)}
                        style={{
                          height: 48,
                          borderRadius: 15,
                          border: `1px solid ${selected ? "var(--violet)" : "var(--line)"}`,
                          background: selected
                            ? "var(--violet)"
                            : "var(--surface)",
                          color: selected ? "#25005a" : "var(--ink)",
                          font: "inherit",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              ) : form.scheduleMode === "flexible" ? (
                <label>
                  <span
                    className="muted"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    Veces por semana, en los días que quieras
                  </span>
                  <select
                    className="field"
                    value={form.weeklyTarget}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        weeklyTarget: Number(event.target.value),
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <option key={value} value={value}>
                        {value} {value === 1 ? "vez" : "veces"} por semana
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span
                    className="muted"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    Veces que debe completarse cada día
                  </span>
                  <select
                    className="field"
                    value={form.dailyTarget}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dailyTarget: Number(event.target.value),
                      })
                    }
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <option key={value} value={value}>
                        {value} veces al día
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </fieldset>
            <label>
              <span className="field-label">Puntos por check-in</span>
              <input
                className="field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={form.points}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  setForm({ ...form, points: value });
                }}
                placeholder="Ej. 10"
              />
            </label>
            <label
              className="stitch-card"
              style={{
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Camera color="var(--violet)" />
              <span style={{ flex: 1 }}>
                <b>Foto como evidencia</b>
                <small className="muted" style={{ display: "block" }}>
                  Privada y visible para validadores.
                </small>
              </span>
              <input
                type="checkbox"
                checked={form.evidenceRequired}
                onChange={(event) =>
                  setForm({ ...form, evidenceRequired: event.target.checked })
                }
              />
            </label>
            <label>
              <span className="field-label">Validación</span>
              <select
                className="field"
                value={form.validationType}
                onChange={(event) =>
                  setForm({ ...form, validationType: event.target.value })
                }
              >
                <option value="PEER_REVIEW">La revisa el rival</option>
                <option value="SELF">Autovalidación</option>
              </select>
            </label>
          </div>
        </section>
      )}
      {step === 4 && (
        <section>
          <h2 className="display" style={{ fontSize: 38, margin: "8px 0 6px" }}>
            Resumen del Pacto
          </h2>
          <p className="muted" style={{ fontSize: 18, margin: "0 0 24px" }}>
            Revisa los términos antes de comprometerte.
          </p>
          <label>
            <span className="field-label">Consecuencia opcional</span>
            <input
              className="field"
              maxLength={240}
              value={form.consequence}
              onChange={(event) =>
                setForm({ ...form, consequence: event.target.value })
              }
            />
          </label>
          <div className="stitch-card" style={{ marginTop: 18, padding: 20 }}>
            <div style={{ display: "grid", gap: 15 }}>
              <Summary Icon={Trophy} label="Reto" value={form.title} />
              <Summary
                Icon={Users}
                label="Participantes"
                value={`${form.participantIds.length} personas`}
              />
              <Summary
                Icon={CalendarDays}
                label="Duración"
                value={`${form.startDate} → ${form.endDate}`}
              />
              <Summary
                Icon={Camera}
                label="Evidencia"
                value={form.evidenceRequired ? "Foto obligatoria" : "Opcional"}
              />
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: 16,
              marginTop: 13,
              display: "flex",
              gap: 11,
              background: "rgb(200 255 55 / 14%)",
            }}
          >
            <ShieldCheck color="var(--violet)" />
            <small style={{ lineHeight: 1.45 }}>
              Nada peligroso, ilegal ni humillante — la consecuencia la decidís
              vosotros. Al enviar, las reglas requerirán la aceptación de todos.
            </small>
          </div>
        </section>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 25 }}>
        {step > 1 && (
          <button
            className="button button-secondary"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft />
            Atrás
          </button>
        )}
        <button
          disabled={loading || (step === 2 && !ready)}
          className="button button-primary"
          style={{ flex: 1 }}
          onClick={() => (step < 4 ? setStep(step + 1) : submit())}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : step === 4 ? (
            <>
              <Sparkles />
              Enviar reto
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
function Summary({
  Icon,
  label,
  value,
}: {
  Icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Icon size={19} color="var(--violet)" />
      <span className="muted" style={{ width: 90, fontSize: 13 }}>
        {label}
      </span>
      <b style={{ flex: 1, textAlign: "right" }}>{value}</b>
    </div>
  );
}
