import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { circleId } = await context.params;
    const { data, error } = await auth.supabase
      .from("circle_invites")
      .insert({ circle_id: circleId, created_by: auth.user.id })
      .select("code,expires_at")
      .single();
    if (error) throw error;
    return ok(data, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
