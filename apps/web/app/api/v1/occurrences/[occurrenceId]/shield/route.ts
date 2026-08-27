import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { flushPendingPushInline } from "@/lib/notifications";
import { allowRequest } from "@/lib/rate-limit";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

const RPC_ERRORS: Record<string, string> = {
  NO_SHIELDS_AVAILABLE: "No te queda ningún comodín en este círculo.",
  OCCURRENCE_ALREADY_USED: "Este check-in ya está resuelto.",
  OUTSIDE_CHECK_IN_WINDOW: "Fuera de plazo para este check-in.",
  CHALLENGE_NOT_ACTIVE: "Este reto ya no está activo.",
  NOT_AUTHORIZED: "No puedes saltar este check-in.",
};

export async function POST(
  request: Request,
  context: { params: Promise<{ occurrenceId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const occurrenceId = uuidSchema.parse((await context.params).occurrenceId);
    if (!allowRequest(`shield-redeem:${auth.user.id}`, 20, 60_000))
      return fail(
        "RATE_LIMITED",
        "Demasiados intentos. Espera un minuto.",
        id,
        429,
      );
    const { data, error } = await auth.supabase.rpc("redeem_circle_shield", {
      target_occurrence_id: occurrenceId,
    });
    if (error) {
      const known = Object.keys(RPC_ERRORS).find((code) =>
        error.message?.includes(code),
      );
      if (known) return fail(known, RPC_ERRORS[known]!, id, 422);
      throw error;
    }
    await flushPendingPushInline();
    return ok(data, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
