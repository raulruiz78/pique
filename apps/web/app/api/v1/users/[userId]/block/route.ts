import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { userId } = await context.params;
    if (userId === auth.user.id)
      return fail("INVALID_BLOCK", "No puedes bloquearte a ti mismo.", id, 422);
    const { error } = await auth.supabase
      .from("friendships")
      .upsert(
        { requester_id: auth.user.id, addressee_id: userId, status: "BLOCKED" },
        { onConflict: "requester_id,addressee_id" },
      );
    if (error) throw error;
    return ok({ blocked: true });
  } catch (error) {
    return fromError(error, id);
  }
}
