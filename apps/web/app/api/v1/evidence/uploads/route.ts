import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/rate-limit";
const schema = z.object({
  occurrenceId: z.uuid(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
});
export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    if (!allowRequest(`upload:${auth.user.id}`, 10, 60_000))
      return fail(
        "RATE_LIMITED",
        "Demasiadas subidas. Espera un minuto.",
        id,
        429,
      );
    const input = schema.parse(await request.json());
    const { data: occurrence } = await auth.supabase
      .from("goal_occurrences")
      .select("id")
      .eq("id", input.occurrenceId)
      .eq("participant_id", auth.user.id)
      .in("status", ["PENDING", "REJECTED"])
      .maybeSingle();
    if (!occurrence)
      return fail(
        "NOT_AUTHORIZED",
        "No puedes subir una prueba para este objetivo.",
        id,
        403,
      );
    const extension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[input.mimeType];
    const path = `${auth.user.id}/${input.occurrenceId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await auth.supabase.storage
      .from("evidence")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return ok({ path, token: data.token });
  } catch (error) {
    return fromError(error, id);
  }
}
