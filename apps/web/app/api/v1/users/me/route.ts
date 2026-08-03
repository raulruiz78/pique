import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { profileSchema } from "@pique/validation";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (error) return fromError(error, id);
  return ok(data);
}
export async function PATCH(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = profileSchema.partial().parse(await request.json());
    const update = {
      ...(input.username === undefined ? {} : { username: input.username }),
      ...(input.displayName === undefined
        ? {}
        : { display_name: input.displayName }),
      ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
      ...(input.locale === undefined ? {} : { locale: input.locale }),
      ...(input.profileVisibility === undefined
        ? {}
        : { profile_visibility: input.profileVisibility }),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await auth.supabase
      .from("profiles")
      .update(update)
      .eq("id", auth.user.id)
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return fromError(error, id);
  }
}
