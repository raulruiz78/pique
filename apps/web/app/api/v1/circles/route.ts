import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { createCircleSchema } from "@pique/validation";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await auth.supabase
    .from("circles")
    .select(
      "id,name,description,owner_id,created_at,circle_members(user_id,role,profiles(display_name,username))",
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
    const input = createCircleSchema.parse(await request.json());
    const { data, error } = await auth.supabase
      .from("circles")
      .insert({
        owner_id: auth.user.id,
        name: input.name,
        description: input.description ?? null,
      })
      .select("id,name,description")
      .single();
    if (error) throw error;
    return ok(data, 201);
  } catch (error) {
    return fromError(error, id);
  }
}
