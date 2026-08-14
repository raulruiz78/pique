import type { ChallengeCategory } from "./challenge-category";

export interface ChallengeTemplate {
  id: string;
  category: ChallengeCategory;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  scheduleMode: "fixed" | "flexible" | "dailyMultiple";
  days: string;
  weeklyTarget: number;
  dailyTarget: number;
  points: number;
  evidenceRequired: boolean;
  validationType: "SELF" | "PEER_REVIEW";
  consequence: string;
}

export const challengeTemplates: ChallengeTemplate[] = [
  {
    id: "steps",
    category: "TRAINING",
    emoji: "🚶",
    title: "5.000 pasos al día",
    tagline: "El clásico que nunca falla",
    description:
      "Suma al menos 5.000 pasos cada día. Vale caminar, correr o lo que sea con piernas.",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor invita a cenar",
  },
  {
    id: "gym3",
    category: "TRAINING",
    emoji: "🏋️",
    title: "3 entrenos por semana",
    tagline: "Constancia sin agobios",
    description:
      "Entrena 3 veces esta semana, tú eliges qué días. Gimnasio, casa o donde sea.",
    scheduleMode: "flexible",
    days: "MO,WE,FR",
    weeklyTarget: 3,
    dailyTarget: 1,
    points: 10,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor invita a cenar",
  },
  {
    id: "no-sugar",
    category: "HEALTH",
    emoji: "🍬",
    title: "Sin azúcar añadido",
    tagline: "Un mes para desengancharte",
    description:
      "Ni bollos, ni refrescos, ni chuches. Todos los días sin excepción.",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: false,
    validationType: "SELF",
    consequence: "El perdedor invita a cenar",
  },
  {
    id: "cook",
    category: "HOME",
    emoji: "🍳",
    title: "Cocina en casa",
    tagline: "Menos delivery, más fogones",
    description:
      "Cocina en casa al menos 4 días a la semana en vez de pedir o comer fuera.",
    scheduleMode: "flexible",
    days: "MO,TU,WE,TH",
    weeklyTarget: 4,
    dailyTarget: 1,
    points: 8,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor cocina para el otro",
  },
  {
    id: "read",
    category: "FOCUS",
    emoji: "📖",
    title: "Leer 20 minutos",
    tagline: "Menos pantalla, más páginas",
    description: "20 minutos de lectura cada día, del libro que sea.",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: false,
    validationType: "SELF",
    consequence: "El perdedor invita a un café",
  },
  {
    id: "no-phone-bed",
    category: "FOCUS",
    emoji: "🌙",
    title: "Sin móvil antes de dormir",
    tagline: "Duerme mejor, empieza mejor",
    description: "Nada de pantallas los últimos 30 minutos antes de acostarte.",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: false,
    validationType: "SELF",
    consequence: "El perdedor invita a un café",
  },
  {
    id: "plan-week",
    category: "SOCIAL",
    emoji: "🎉",
    title: "Un plan juntos a la semana",
    tagline: "Que no se os pase la semana sin veros",
    description:
      "Quedad al menos una vez a la semana para hacer algo juntos, lo que sea.",
    scheduleMode: "flexible",
    days: "SA",
    weeklyTarget: 1,
    dailyTarget: 1,
    points: 15,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El que lo proponga elige el plan",
  },
  {
    id: "walk-daily",
    category: "OUTDOORS",
    emoji: "🌿",
    title: "Paseo diario al aire libre",
    tagline: "Sal aunque sea 15 minutos",
    description: "Un paseo al aire libre cada día, sin excusas de tiempo.",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor invita a cenar",
  },
  {
    id: "creative-10",
    category: "CREATIVE",
    emoji: "🎨",
    title: "10 minutos de algo creativo",
    tagline: "Dibujar, tocar, escribir... lo tuyo",
    description:
      "10 minutos al día practicando lo que te dé la gana: música, dibujo, escritura...",
    scheduleMode: "fixed",
    days: "MO,TU,WE,TH,FR,SA,SU",
    weeklyTarget: 7,
    dailyTarget: 1,
    points: 5,
    evidenceRequired: true,
    validationType: "PEER_REVIEW",
    consequence: "El perdedor invita a un café",
  },
];
