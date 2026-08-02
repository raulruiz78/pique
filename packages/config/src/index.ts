import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  CRON_SECRET: z.string().min(24).optional(),
});

export function parseServerEnv(input: Record<string, string | undefined>) {
  return serverEnvSchema.parse(input);
}

export const security = {
  maxEvidenceBytes: 10 * 1024 * 1024,
  signedUrlTtlSeconds: 300,
  evidenceMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
};
