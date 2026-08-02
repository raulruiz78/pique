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
    const { data: circle } = await auth.supabase
      .from("circles")
      .select("id,avatar_path")
      .eq("id", parsedCircleId)
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (!circle)
      return fail(
        "CIRCLE_NOT_FOUND",
        "El círculo no existe o no puedes eliminarlo.",
        id,
        404,
      );
    if (circle.avatar_path) {
      const { error: imageError } = await auth.supabase.storage
        .from("profile-images")
        .remove([circle.avatar_path]);
      if (imageError) throw imageError;
    }
    const { data, error } = await auth.supabase
      .from("circles")
      .delete()
      .eq("id", parsedCircleId)
      .eq("owner_id", auth.user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("CIRCLE_DELETE_FAILED");
    return ok({ id: data.id });
  } catch (error) {
    return fromError(error, id);
  }
}
