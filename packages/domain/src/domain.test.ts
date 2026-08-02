import { describe, expect, it } from 'vitest';
import { transitionChallenge } from './challenge.js';
import { assertReviewer, transitionCheckIn } from './check-in.js';
import { rankParticipants } from './leaderboard.js';
import { generateOccurrences } from './occurrences.js';
import { calculateScore, scoreIdempotencyKey } from './scoring.js';
import { calculateDailyStreak } from './streaks.js';

describe('motor de dominio', () => {
  it('controla las transiciones de reto', () => {
    expect(transitionChallenge('DRAFT', 'PENDING_ACCEPTANCE')).toBe('PENDING_ACCEPTANCE');
    expect(() => transitionChallenge('DRAFT', 'COMPLETED')).toThrow(/No se puede/);
  });

  it('controla validaciones y evita autorrevisión', () => {
    expect(transitionCheckIn('PENDING_REVIEW', 'APPROVED')).toBe('APPROVED');
    expect(() => assertReviewer({ reviewerId: 'a', ownerId: 'a', participantIds: ['a', 'b'] })).toThrow(/propia/);
  });

  it('calcula puntos y una clave estable', () => {
    expect(calculateScore({ base: 10, streak: 6, streakEvery: 3, streakPoints: 5, penalties: 3 }).total).toBe(17);
    expect(scoreIdempotencyKey({ userId: 'a', sourceType: 'check-in', sourceId: '1', reason: 'approved' })).toBe('a:check-in:1:approved');
  });

  it('calcula rachas sin contar fechas duplicadas', () => {
    const dates = ['2026-08-02', '2026-08-01', '2026-08-01', '2026-07-31'].map((date) => new Date(`${date}T12:00:00Z`));
    expect(calculateDailyStreak(dates, new Date('2026-08-02T15:00:00Z'))).toBe(3);
  });

  it('genera ocurrencias limitadas al horizonte', () => {
    const occurrences = generateOccurrences({ startAt: new Date('2026-08-03T08:00:00Z'), endAt: new Date('2026-09-30T08:00:00Z'), rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' });
    expect(occurrences).toHaveLength(13);
    expect(occurrences.every((item) => [1, 3, 5].includes(item.startsAt.getUTCDay()))).toBe(true);
  });

  it('desempata por check-ins, momento y usuario', () => {
    const ranked = rankParticipants([
      { userId: 'b', score: 20, approvedCheckIns: 2, lastScoredAt: new Date('2026-08-02') },
      { userId: 'a', score: 20, approvedCheckIns: 3, lastScoredAt: new Date('2026-08-03') },
    ]);
    expect(ranked.map((entry) => entry.userId)).toEqual(['a', 'b']);
  });
});

