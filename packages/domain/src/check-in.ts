import { DomainError } from './challenge.js';
import type { CheckInStatus } from './types.js';

const transitions: Readonly<Record<CheckInStatus, readonly CheckInStatus[]>> = {
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'DISPUTED', 'EXPIRED'],
  APPROVED: ['DISPUTED'],
  REJECTED: ['DISPUTED'],
  DISPUTED: ['APPROVED', 'REJECTED'],
  EXPIRED: [],
};

export function transitionCheckIn(from: CheckInStatus, to: CheckInStatus): CheckInStatus {
  if (!transitions[from].includes(to)) {
    throw new DomainError('INVALID_CHECK_IN_TRANSITION', `No se puede pasar de ${from} a ${to}.`);
  }
  return to;
}

export function assertInsideCheckInWindow(now: Date, opensAt: Date, closesAt: Date): void {
  if (now < opensAt || now > closesAt) {
    throw new DomainError('OUTSIDE_CHECK_IN_WINDOW', 'Este check-in está fuera de plazo.');
  }
}

export function assertReviewer(options: {
  reviewerId: string;
  ownerId: string;
  participantIds: readonly string[];
}): void {
  if (options.reviewerId === options.ownerId) {
    throw new DomainError('SELF_REVIEW_NOT_ALLOWED', 'No puedes validar tu propia evidencia.');
  }
  if (!options.participantIds.includes(options.reviewerId)) {
    throw new DomainError('REVIEWER_NOT_AUTHORIZED', 'No perteneces a este reto.');
  }
}

