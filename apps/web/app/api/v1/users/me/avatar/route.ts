import { fail, fromError, ok, requestId, requireUser } from "@/lib/api";
import { allowRequest } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024),
});
const finalizeSchema = z.object({ path: z.string().min(1).max(300) });
const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    if (!allowRequest(`avatar:${auth.user.id}`, 6, 60_000))
      return fail(
        "RATE_LIMITED",
        "Espera un minuto antes de subir otra foto.",
        id,
        429,
      );
    const input = uploadSchema.parse(await request.json());
    const path = `profiles/${auth.user.id}/${crypto.randomUUID()}.${extensions[input.mimeType]}`;
    const { data, error } = await auth.supabase.storage
      .from("profile-images")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return ok({ path, token: data.token });
  } catch (error) {
    return fromError(error, id);
  }
}

export async function PATCH(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = finalizeSchema.parse(await request.json());
    if (!input.path.startsWith(`profiles/${auth.user.id}/`))
      return fail(
        "INVALID_IMAGE_PATH",
        "La ruta de imagen no es válida.",
        id,
        403,
      );
    const { data: current } = await auth.supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", auth.user.id)
      .single();
    const { error } = await auth.supabase
      .from("profiles")
      .update({ avatar_path: input.path, updated_at: new Date().toISOString() })
      .eq("id", auth.user.id);
    if (error) throw error;
    if (current?.avatar_path && current.avatar_path !== input.path)
      await auth.supabase.storage
        .from("profile-images")
        .remove([current.avatar_path]);
    return ok({ path: input.path });
  } catch (error) {
    return fromError(error, id);
  }
}

export async function DELETE(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const { data: current } = await auth.supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", auth.user.id)
      .single();
    const { error } = await auth.supabase
      .from("profiles")
      .update({ avatar_path: null, updated_at: new Date().toISOString() })
      .eq("id", auth.user.id);
    if (error) throw error;
    if (current?.avatar_path)
      await auth.supabase.storage
        .from("profile-images")
        .remove([current.avatar_path]);
    return ok({ removed: true });
  } catch (error) {
    return fromError(error, id);
  }
}
