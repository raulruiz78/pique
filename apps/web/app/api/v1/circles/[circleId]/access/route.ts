import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const circleId = uuidSchema.parse((await context.params).circleId);
  const { data: circle, error } = await auth.supabase
    .from("circles")
    .select("id,visibility,owner_id")
    .eq("id", circleId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  if (error) return fromError(error, id);
  if (!circle)
    return fail(
      "NOT_AUTHORIZED",
      "Solo el creador puede gestionar el acceso.",
      id,
      403,
    );
  const { data: requests, error: requestError } = await auth.supabase
    .from("circle_join_requests")
    .select("id,user_id,created_at,profiles(display_name,username,avatar_path)")
    .eq("circle_id", circleId)
    .eq("status", "PENDING")
    .order("created_at");
  if (requestError) return fromError(requestError, id);
  return ok({ visibility: circle.visibility, requests: requests ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    uuidSchema.parse((await context.params).circleId);
    const body = (await request.json()) as {
      requestId?: string;
      approve?: boolean;
    };
    const requestIdValue = uuidSchema.parse(body.requestId);
    const { error } = await auth.supabase.rpc("decide_circle_join_request", {
      target_request_id: requestIdValue,
      approve: Boolean(body.approve),
    });
    if (error) throw error;
    return ok({ decided: true });
  } catch (error) {
    return fromError(error, id);
  }
}
