import { DomainError } from "./challenge.js";

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export interface Occurrence {
  startsAt: Date;
  closesAt: Date;
}

export function parseWeeklyRRule(rrule: string): Set<string> {
  const parts: Record<string, string | undefined> = {};
  for (const part of rrule.split(";")) {
    const [key, value] = part.split("=", 2);
    if (key) parts[key] = value;
  }
  if (parts.FREQ !== "DAILY" && parts.FREQ !== "WEEKLY") {
    throw new DomainError(
      "UNSUPPORTED_RECURRENCE",
      "El MVP admite recurrencias diarias o semanales.",
    );
  }
  if (parts.FREQ === "DAILY") return new Set(DAY_CODES);
  const days = new Set((parts.BYDAY ?? "").split(",").filter(Boolean));
  if (
    days.size === 0 ||
    [...days].some(
      (day) => !DAY_CODES.includes(day as (typeof DAY_CODES)[number]),
    )
  ) {
    throw new DomainError(
      "INVALID_RECURRENCE",
      "La recurrencia semanal necesita días válidos.",
    );
  }
  return days;
}

export function generateOccurrences(input: {
  startAt: Date;
  endAt: Date;
  rrule: string;
  horizonDays?: number;
  windowHours?: number;
}): Occurrence[] {
  if (input.endAt < input.startAt)
    throw new DomainError(
      "INVALID_DATE_RANGE",
      "La fecha final debe ser posterior al inicio.",
    );
  const allowedDays = parseWeeklyRRule(input.rrule);
  const horizonDays = Math.max(1, input.horizonDays ?? 30);
  const horizon = new Date(
    input.startAt.getTime() + (horizonDays - 1) * 86_400_000,
  );
  const limit = input.endAt < horizon ? input.endAt : horizon;
  const result: Occurrence[] = [];
  for (
    let cursor = new Date(input.startAt);
    cursor <= limit;
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    if (allowedDays.has(DAY_CODES[cursor.getUTCDay()]!)) {
      result.push({
        startsAt: cursor,
        closesAt: new Date(
          cursor.getTime() + (input.windowHours ?? 24) * 3_600_000,
        ),
      });
    }
  }
  return result;
}
