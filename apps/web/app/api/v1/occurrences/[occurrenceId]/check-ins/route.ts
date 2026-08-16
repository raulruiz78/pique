import { fail, fromError, requestId, requireUser } from "@/lib/api";
import { flushPendingPushInline } from "@/lib/notifications";
import { checkInSchema } from "@pique/validation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/rate-limit";
const bodySchema = checkInSchema.extend({
  evidence: z
    .object({
      storagePath: z.string().min(10).max(300),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      sizeBytes: z
        .number()
        .int()
        .min(1)
        .max(10 * 1024 * 1024),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .optional(),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ occurrenceId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    if (!allowRequest(`checkin:${auth.user.id}`, 20, 60_000))
      return fail(
        "RATE_LIMITED",
        "Demasiados intentos. Espera un minuto.",
        id,
        429,
      );
    const key = request.headers.get("idempotency-key");
    if (!key)
      return fail(
        "IDEMPOTENCY_KEY_REQUIRED",
        "Falta la clave de idempotencia.",
        id,
        400,
      );
    const existing = await auth.supabase
      .from("idempotency_keys")
      .select("response_body,response_code")
      .eq("user_id", auth.user.id)
      .eq("key", key)
      .maybeSingle();
    if (existing.data?.response_body)
      return NextResponse.json(existing.data.response_body, {
        status: existing.data.response_code ?? 200,
      });
    const input = bodySchema.parse(await request.json());
    const { occurrenceId } = await context.params;
    // Si esto es un reenvío tras un rechazo, el RPC reutiliza el mismo
    // check-in (occurrence_id es único) y sustituye su evidencia — pero el
    // blob anterior en Storage no se borra solo. Se captura antes de llamar
    // al RPC para poder limpiarlo después si la evidencia cambia.
    const { data: previousCheckIn } = await auth.supabase
      .from("check_ins")
      .select("id")
      .eq("occurrence_id", occurrenceId)
      .maybeSingle();
    let previousEvidencePath: string | null = null;
    if (previousCheckIn) {
      const { data: previousEvidence } = await auth.supabase
        .from("evidence")
        .select("storage_path")
        .eq("check_in_id", previousCheckIn.id)
        .maybeSingle();
      previousEvidencePath = previousEvidence?.storage_path ?? null;
    }
    const { data, error } = await auth.supabase.rpc("submit_check_in", {
      target_occurrence_id: occurrenceId,
      check_note: input.note ?? null,
      check_value: input.value ?? null,
      evidence_payload: input.evidence ?? null,
    });
    if (error) throw error;
    if (
      previousEvidencePath &&
      input.evidence &&
      previousEvidencePath !== input.evidence.storagePath
    ) {
      try {
        await auth.supabase.storage
          .from("evidence")
          .remove([previousEvidencePath]);
      } catch {
        // No crítico.
      }
    }
    const responseBody = { data };
    await auth.supabase.from("idempotency_keys").insert({
      user_id: auth.user.id,
      key,
      request_hash: occurrenceId,
      response_code: 201,
      response_body: responseBody,
    });
    await flushPendingPushInline();
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    return fromError(error, id);
  }
}
