"use client";
import { Camera, ChevronRight, Flame, Swords, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SLIDES = [
  {
    Icon: Users,
    title: "Así funciona Pique",
    body: "Creas círculos con tu gente y os retáis entre vosotros. Nada de apps que usa nadie: aquí hay piques de verdad.",
  },
  {
    Icon: Swords,
    title: "Proponer y aceptar",
    body: "Cualquiera del círculo puede proponer un reto. En cuanto todos aceptan, empieza la cuenta atrás.",
  },
  {
    Icon: Camera,
    title: "Check-in y validación",
    body: "Cada día que cumples, subes tu evidencia. Tu rival la valida — no vale hacer trampas.",
  },
  {
    Icon: Flame,
    title: "Racha, puntos y consecuencias",
    body: "Suma puntos, no rompas la racha, y que quien pierda pague lo que hayáis pactado.",
  },
] as const;

export function OnboardingTutorial() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  if (!visible) return null;

  async function finish() {
    setVisible(false);
    await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    }).catch(() => undefined);
    router.refresh();
  }

  const slide = SLIDES[step]!;
  const last = step === SLIDES.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--canvas)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        padding:
          "max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => void finish()}
          className="button button-secondary"
          style={{ paddingInline: 16 }}
        >
          Saltar
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        <span
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgb(210 187 255 / 12%)",
            border: "1px solid rgb(210 187 255 / 20%)",
          }}
        >
          <slide.Icon size={40} color="var(--violet)" />
        </span>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: "0 0 14px" }}>
            {slide.title}
          </h1>
          <p
            className="muted"
            style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 320 }}
          >
            {slide.body}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 22,
        }}
      >
        {SLIDES.map((item, index) => (
          <span
            key={item.title}
            style={{
              width: index === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: index === step ? "var(--violet)" : "var(--line)",
              transition: "width 0.2s",
            }}
          />
        ))}
      </div>
      <button
        type="button"
        className="button button-primary"
        style={{ width: "100%" }}
        onClick={() => (last ? void finish() : setStep(step + 1))}
      >
        {last ? "Vamos allá" : "Siguiente"}
        {!last && <ChevronRight size={18} />}
      </button>
    </div>
  );
}
