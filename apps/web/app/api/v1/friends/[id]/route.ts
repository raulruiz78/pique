import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { flushPendingPushInline } from "@/lib/notifications";
import { respondFriendRequestSchema, uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { id: friendshipId } = await context.params;
    uuidSchema.parse(friendshipId);
    const input = respondFriendRequestSchema.parse(await request.json());
    const { data, error } = await auth.supabase.rpc(
      "respond_to_friend_request",
      { request_id: friendshipId, response: input.response },
    );
    if (error) {
      if (error.message?.includes("NOT_AUTHORIZED"))
        return fail(
          "NOT_AUTHORIZED",
          "No puedes responder a esta solicitud.",
          id,
          403,
        );
      throw error;
    }
    await flushPendingPushInline();
    return ok(data);
  } catch (error) {
    return fromError(error, id);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { id: friendshipId } = await context.params;
    uuidSchema.parse(friendshipId);
    const { error } = await auth.supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) throw error;
    return ok({ removed: true });
  } catch (error) {
    return fromError(error, id);
  }
}
