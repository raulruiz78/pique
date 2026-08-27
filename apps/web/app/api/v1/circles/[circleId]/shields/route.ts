import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const circleId = uuidSchema.parse((await context.params).circleId);
    if (!allowRequest(`shield-purchase:${auth.user.id}`, 10, 60_000))
      return fail(
        "RATE_LIMITED",
        "Espera un minuto antes de comprar otro comodín.",
        id,
        429,
      );
    const { data, error } = await auth.supabase.rpc("purchase_circle_shield", {
      target_circle_id: circleId,
    });
    if (error) {
      if (error.message?.includes("INSUFFICIENT_COINS"))
        return fail(
          "INSUFFICIENT_COINS",
          "Aún no tienes 1000 coins en este círculo.",
          id,
          422,
        );
      throw error;
    }
    return ok(data, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
