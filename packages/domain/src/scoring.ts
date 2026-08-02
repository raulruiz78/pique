import type { ScoreBreakdown } from './types.js';

export interface ScoreInput {
  base: number;
  streak?: number;
  streakEvery?: number;
  streakPoints?: number;
  difficultyBonus?: number;
  completionBonus?: number;
  penalties?: number;
}

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const positive = (value: number | undefined) => Math.max(0, value ?? 0);
  const streakEvery = Math.max(1, input.streakEvery ?? Number.MAX_SAFE_INTEGER);
  const streakBonus = Math.floor(positive(input.streak) / streakEvery) * positive(input.streakPoints);
  const breakdown = {
    base: positive(input.base),
    streakBonus,
    difficultyBonus: positive(input.difficultyBonus),
    completionBonus: positive(input.completionBonus),
    penalties: positive(input.penalties),
  };
  return { ...breakdown, total: Math.max(0, breakdown.base + streakBonus + breakdown.difficultyBonus + breakdown.completionBonus - breakdown.penalties) };
}

export function scoreIdempotencyKey(input: {
  userId: string;
  sourceType: string;
  sourceId: string;
  reason: string;
}): string {
  return [input.userId, input.sourceType, input.sourceId, input.reason].join(':');
}

