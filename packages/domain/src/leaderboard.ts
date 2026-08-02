import type { RankedEntry, RankingEntry } from './types.js';

export function rankParticipants(entries: readonly RankingEntry[]): RankedEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.approvedCheckIns !== a.approvedCheckIns) return b.approvedCheckIns - a.approvedCheckIns;
      const aTime = a.lastScoredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.lastScoredAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return a.userId.localeCompare(b.userId);
    })
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

