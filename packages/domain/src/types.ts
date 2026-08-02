export type ChallengeStatus =
  | "DRAFT"
  | "PENDING_ACCEPTANCE"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED"
  | "DISPUTED";

export type CheckInStatus =
  "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DISPUTED" | "EXPIRED";

export type ChallengeType =
  "DAILY" | "FREQUENCY" | "CUMULATIVE" | "ONE_VS_ONE" | "GROUP";

export interface ScoreBreakdown {
  base: number;
  streakBonus: number;
  difficultyBonus: number;
  completionBonus: number;
  penalties: number;
  total: number;
}

export interface RankingEntry {
  userId: string;
  score: number;
  approvedCheckIns: number;
  lastScoredAt: Date | null;
}

export interface RankedEntry extends RankingEntry {
  position: number;
}
