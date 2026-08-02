import { z } from 'zod';

export const uuidSchema = z.uuid();
export const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-z0-9_]+$/i);

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(2).max(60),
  timezone: z.string().min(3).max(64),
  locale: z.enum(['es', 'en']).default('es'),
});

export const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional(),
});

export const createChallengeSchema = z.object({
  circleId: uuidSchema,
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).default(''),
  type: z.enum(['DAILY', 'FREQUENCY', 'CUMULATIVE', 'ONE_VS_ONE', 'GROUP']),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  timezone: z.string().min(3).max(64),
  recurrence: z.string().max(200),
  points: z.int().min(1).max(10_000),
  evidenceRequired: z.boolean(),
  validationType: z.enum(['SELF', 'PEER_REVIEW']),
  consequence: z.string().trim().max(240).optional(),
  participantIds: z.array(uuidSchema).min(2).max(20),
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), { path: ['endAt'], message: 'La fecha final debe ser posterior al inicio.' });

export const checkInSchema = z.object({
  note: z.string().trim().max(500).optional(),
  value: z.number().finite().nonnegative().optional(),
  evidenceId: uuidSchema.optional(),
});

export const validationDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().trim().max(500).optional(),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

