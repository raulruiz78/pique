import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { sendFriendRequestSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data: friendships, error } = await auth.supabase
    .from("friendships")
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .neq("status", "BLOCKED")
    .order("created_at", { ascending: false });
  if (error) return fromError(error, id);

  const otherIds = Array.from(
    new Set(
      (friendships ?? []).map((row) =>
        row.requester_id === auth.user.id ? row.addressee_id : row.requester_id,
      ),
    ),
  );
  const { data: profiles } = otherIds.length
    ? await auth.supabase
        .from("profiles")
        .select("id,username,display_name,avatar_path")
        .in("id", otherIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));

  const items = (friendships ?? []).map((row) => {
    const isRequester = row.requester_id === auth.user.id;
    const otherId = isRequester ? row.addressee_id : row.requester_id;
    return {
      id: row.id,
      status: row.status,
      direction: isRequester ? "OUTGOING" : "INCOMING",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      profile: profileById.get(otherId) ?? null,
    };
  });
  return ok(items);
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = sendFriendRequestSchema.parse(await request.json());
    const { data, error } = await auth.supabase.rpc("send_friend_request", {
      target_username: input.username,
    });
    if (error) {
      if (error.message?.includes("USER_NOT_FOUND"))
        return fail("USER_NOT_FOUND", "No existe ese usuario.", id, 404);
      if (error.message?.includes("USER_BLOCKED"))
        return fail(
          "USER_BLOCKED",
          "No es posible enviar la solicitud.",
          id,
          403,
        );
      if (error.message?.includes("INVALID_REQUEST"))
        return fail(
          "INVALID_REQUEST",
          "No puedes añadirte a ti mismo.",
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
