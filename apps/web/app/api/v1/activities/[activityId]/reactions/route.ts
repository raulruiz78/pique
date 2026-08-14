import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { reactionSchema, uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ activityId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { activityId } = await context.params;
    uuidSchema.parse(activityId);
    const input = reactionSchema.parse(await request.json());
    const { error } = await auth.supabase.from("reactions").upsert(
      {
        activity_id: activityId,
        user_id: auth.user.id,
        emoji: input.emoji,
      },
      { onConflict: "activity_id,user_id" },
    );
    if (error) throw error;
    return ok({ reacted: true });
  } catch (error) {
    return fromError(error, id);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ activityId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { activityId } = await context.params;
    uuidSchema.parse(activityId);
    const { error } = await auth.supabase
      .from("reactions")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", auth.user.id);
    if (error) throw error;
    return ok({ reacted: false });
  } catch (error) {
    return fromError(error, id);
  }
}
