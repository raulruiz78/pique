import type { ChallengeStatus } from './types.js';

const transitions: Readonly<Record<ChallengeStatus, readonly ChallengeStatus[]>> = {
  DRAFT: ['PENDING_ACCEPTANCE', 'CANCELLED'],
  PENDING_ACCEPTANCE: ['SCHEDULED', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  SCHEDULED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
  PAUSED: ['ACTIVE', 'CANCELLED', 'DISPUTED'],
  DISPUTED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransitionChallenge(from: ChallengeStatus, to: ChallengeStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionChallenge(from: ChallengeStatus, to: ChallengeStatus): ChallengeStatus {
  if (!canTransitionChallenge(from, to)) {
    throw new DomainError('INVALID_CHALLENGE_TRANSITION', `No se puede pasar de ${from} a ${to}.`);
  }
  return to;
}

export function statusAfterAllAccept(options: { startAt: Date; now: Date }): ChallengeStatus {
  return options.startAt.getTime() > options.now.getTime() ? 'SCHEDULED' : 'ACTIVE';
}

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

