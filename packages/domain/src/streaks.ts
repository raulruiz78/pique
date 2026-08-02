const DAY_MS = 86_400_000;

function utcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function calculateDailyStreak(completedDates: readonly Date[], today: Date): number {
  const unique = [...new Set(completedDates.map(utcDay))].sort((a, b) => b - a);
  if (unique.length === 0) return 0;
  const todayDay = utcDay(today);
  if (unique[0] !== todayDay && unique[0] !== todayDay - DAY_MS) return 0;
  let streak = 1;
  for (let index = 1; index < unique.length; index += 1) {
    if (unique[index - 1]! - unique[index]! !== DAY_MS) break;
    streak += 1;
  }
  return streak;
}

