import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await auth.supabase.rpc("discover_public_circles");
  if (error) return fromError(error, id);
  return ok(data ?? []);
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const body = (await request.json()) as { circleId?: string };
    if (!body.circleId) throw new Error("CIRCLE_REQUIRED");
    const { error } = await auth.supabase.rpc("request_public_circle_join", {
      target_circle_id: body.circleId,
    });
    if (error) throw error;
    return ok({ requested: true });
  } catch (error) {
    return fromError(error, id);
  }
}
