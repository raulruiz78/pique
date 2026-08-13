import { fromError, ok, requestId, requireUser } from "@/lib/api";
import { deviceSubscriptionSchema } from "@pique/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = deviceSubscriptionSchema.parse(await request.json());
    const { error } = await auth.supabase.from("devices").upsert(
      {
        user_id: auth.user.id,
        endpoint: input.endpoint,
        public_key: input.publicKey,
        auth_secret: input.authSecret,
        enabled: true,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return ok({ subscribed: true });
  } catch (error) {
    return fromError(error, id);
  }
}

const unsubscribeSchema = z.object({ endpoint: z.url().max(2048) });

export async function DELETE(request: Request) {
  const id = requestId(request);
  try {
    const auth = await requireUser(id);
    if (auth instanceof NextResponse) return auth;
    const input = unsubscribeSchema.parse(await request.json());
    const { error } = await auth.supabase
      .from("devices")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("endpoint", input.endpoint);
    if (error) throw error;
    return ok({ unsubscribed: true });
  } catch (error) {
    return fromError(error, id);
  }
}
