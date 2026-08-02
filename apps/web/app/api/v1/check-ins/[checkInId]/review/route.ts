import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { validationDecisionSchema } from "@pique/validation";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ checkInId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const key = request.headers.get("idempotency-key");
    if (!key)
      return fail(
        "IDEMPOTENCY_KEY_REQUIRED",
        "Falta la clave de idempotencia.",
        id,
        400,
      );
    const input = validationDecisionSchema.parse(await request.json());
    const { checkInId } = await context.params;
    const { data, error } = await auth.supabase.rpc("review_check_in", {
      target_check_in_id: checkInId,
      review_decision: input.decision,
      review_reason: input.reason ?? null,
    });
    if (error && error.message.includes("ALREADY_REVIEWED"))
      return ok({ status: "ALREADY_REVIEWED" });
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return fromError(error, id);
  }
}
