export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ApiErrorShape {
  error: { code: string; message: string; details?: Json; requestId: string };
}

export interface TodayOccurrenceRow {
  id: string;
  title: string;
  challengeTitle: string;
  points: number;
  startsAt: string;
  closesAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  evidenceRequired: boolean;
}

