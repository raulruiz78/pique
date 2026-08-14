import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { flushPendingPushInline } from "@/lib/notifications";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const body = (await request.json()) as { response?: string };
    if (!["ACCEPTED", "REJECTED"].includes(body.response ?? ""))
      return fail("VALIDATION_ERROR", "Respuesta no válida.", id, 422);
    const { challengeId } = await context.params;
    const { data, error } = await auth.supabase.rpc("respond_to_challenge", {
      target_challenge_id: challengeId,
      response: body.response,
    });
    if (error) throw error;
    await flushPendingPushInline();
    return ok({ status: data });
  } catch (error) {
    return fromError(error, id);
  }
}
