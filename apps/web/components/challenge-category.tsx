export const challengeCategories = [
  {
    value: "TRAINING",
    label: "Entrenamiento",
    emoji: "🏋️",
    examples: "Correr, gimnasio, bici o deporte",
  },
  {
    value: "HEALTH",
    label: "Vida saludable",
    emoji: "🥗",
    examples: "Comer sano, higiene o suplementos",
  },
  {
    value: "HOME",
    label: "Tareas del hogar",
    emoji: "🧹",
    examples: "Barrer, fregar, ordenar o cocinar",
  },
  {
    value: "FOCUS",
    label: "Foco y mente",
    emoji: "🧠",
    examples: "Leer, estudiar, meditar o aprender",
  },
  {
    value: "SOCIAL",
    label: "Social y diversión",
    emoji: "🎉",
    examples: "Salir, planes, cerveza o aventuras",
  },
  {
    value: "CREATIVE",
    label: "Creatividad",
    emoji: "🎨",
    examples: "Música, dibujo, escritura o proyectos",
  },
  {
    value: "OUTDOORS",
    label: "Aire libre",
    emoji: "🌿",
    examples: "Caminar, montaña, playa o naturaleza",
  },
  {
    value: "OTHER",
    label: "Reto libre",
    emoji: "⚡",
    examples: "Cualquier pique que se os ocurra",
  },
] as const;

export type ChallengeCategory = (typeof challengeCategories)[number]["value"];
export function categoryMeta(value?: string) {
  return (
    challengeCategories.find((item) => item.value === value) ??
    challengeCategories.at(-1)!
  );
}

export function CategoryBadge({
  category,
  size = 52,
}: {
  category?: string | undefined;
  size?: number;
}) {
  const meta = categoryMeta(category);
  return (
    <span
      title={meta.label}
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: Math.round(size * 0.3),
        display: "grid",
        placeItems: "center",
        fontSize: Math.round(size * 0.48),
        background: "rgb(210 187 255 / 12%)",
        border: "1px solid rgb(210 187 255 / 15%)",
      }}
    >
      {meta.emoji}
    </span>
  );
}
