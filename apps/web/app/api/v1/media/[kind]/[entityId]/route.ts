import { fail, fromError, requestId, requireUser } from "@/lib/api";
import { uuidSchema } from "@pique/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

const kindSchema = z.enum(["profiles", "circles"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; entityId: string }> },
) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const params = await context.params;
    const kind = kindSchema.parse(params.kind);
    const entityId = uuidSchema.parse(params.entityId);
    const table = kind === "profiles" ? "profiles" : "circles";
    const { data: entity, error } = await auth.supabase
      .from(table)
      .select("avatar_path")
      .eq("id", entityId)
      .maybeSingle();
    if (error) throw error;
    if (!entity?.avatar_path)
      return fail("IMAGE_NOT_FOUND", "La imagen no existe.", id, 404);
    const { data: image, error: downloadError } = await auth.supabase.storage
      .from("profile-images")
      .download(entity.avatar_path);
    if (downloadError) throw downloadError;
    return new NextResponse(await image.arrayBuffer(), {
      headers: {
        "Content-Type": image.type || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return fromError(error, id);
  }
}
