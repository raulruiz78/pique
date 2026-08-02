import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
import { z } from "zod";
const schema = z
  .object({
    reportedUserId: z.uuid().optional(),
    circleId: z.uuid().optional(),
    reason: z.string().trim().min(5).max(500),
  })
  .refine((value) => value.reportedUserId || value.circleId);
export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = schema.parse(await request.json());
    if (input.reportedUserId === auth.user.id)
      return fail(
        "INVALID_REPORT",
        "No puedes denunciarte a ti mismo.",
        id,
        422,
      );
    const { data, error } = await auth.supabase
      .from("reports")
      .insert({
        reporter_id: auth.user.id,
        reported_user_id: input.reportedUserId ?? null,
        circle_id: input.circleId ?? null,
        reason: input.reason,
      })
      .select("id,status")
      .single();
    if (error) throw error;
    return ok(data, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
