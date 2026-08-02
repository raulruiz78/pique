import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { circleId } = await context.params;
    const parsedCircleId = uuidSchema.parse(circleId);
    const { data, error } = await auth.supabase
      .from("circles")
      .delete()
      .eq("id", parsedCircleId)
      .eq("owner_id", auth.user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return fail(
        "CIRCLE_NOT_FOUND",
        "El círculo no existe o no puedes eliminarlo.",
        id,
        404,
      );
    return ok({ id: data.id });
  } catch (error) {
    return fromError(error, id);
  }
}
