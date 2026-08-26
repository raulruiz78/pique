import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  const { data, error } = await auth.supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return fromError(error, id);
  return ok(data);
}
export async function PATCH(request: Request) {
  const id = requestId(request);
  const auth = await requireUser(id);
  if (auth instanceof NextResponse) return auth;
  // Sin cuerpo (o sin `id`): marca todas — es lo que dispara el botón
  // "Marcar leídas". Con `id`: marca solo esa notificación — es lo que
  // dispara tocar una notificación concreta en la lista.
  const notificationId = await request
    .json()
    .then((body: { id?: unknown }) =>
      typeof body?.id === "string" ? body.id : undefined,
    )
    .catch(() => undefined);
  let query = auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", auth.user.id)
    .is("read_at", null);
  if (notificationId) query = query.eq("id", notificationId);
  const { error } = await query;
  if (error) return fromError(error, id);
  return ok({ updated: true });
}
