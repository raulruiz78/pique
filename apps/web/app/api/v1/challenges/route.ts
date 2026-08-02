import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { createChallengeSchema } from "@pique/validation";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await auth.supabase
    .from("challenges")
    .select(
      "id,title,description,type,status,start_at,end_at,circle_id,challenge_participants(user_id,acceptance,score,profiles(display_name))",
    )
    .order("created_at", { ascending: false });
  if (error) return fromError(error, id);
  return ok(data);
}
export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = createChallengeSchema.parse(await request.json());
    const payload = {
      ...input,
      rules: input.description,
      goalName: input.title,
      metric: "BOOLEAN",
      target: 1,
      unit: "vez",
    };
    const { data, error } = await auth.supabase.rpc("create_challenge", {
      payload,
    });
    if (error) throw error;
    return ok({ id: data }, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
