import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { challengeId } = await context.params;
    const parsedChallengeId = uuidSchema.parse(challengeId);
    const { data, error } = await auth.supabase
      .from("challenges")
      .delete()
      .eq("id", parsedChallengeId)
      .eq("creator_id", auth.user.id)
      .in("status", ["DRAFT", "PENDING_ACCEPTANCE", "SCHEDULED", "ACTIVE"])
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return fail(
        "CHALLENGE_NOT_DELETABLE",
        "Este reto no existe, no lo creaste tú, o ya ha terminado y no se puede eliminar.",
        id,
        404,
      );
    return ok({ id: data.id });
  } catch (error) {
    return fromError(error, id);
  }
}
