import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { code } = await context.params;
    const { data, error } = await auth.supabase.rpc("accept_circle_invite", {
      invite_code: code,
    });
    if (error) throw error;
    return ok({ circleId: data });
  } catch (error) {
    return fromError(error, id);
  }
}
