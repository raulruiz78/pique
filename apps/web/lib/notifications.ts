import { shouldSendPush, type NotificationPreferences } from "@pique/domain";
import { createWebPushSender } from "./push-webpush";
import { noOpPushSender, type PushSender } from "./push";
import type { createAdminSupabase } from "./supabase/admin";

type AdminSupabase = NonNullable<ReturnType<typeof createAdminSupabase>>;

interface FlushOptions {
  userIds?: string[];
  limit?: number;
  sender?: PushSender;
}

export async function flushPendingPush(
  admin: AdminSupabase,
  options: FlushOptions = {},
): Promise<{ pushed: number }> {
  const sender = options.sender ?? createWebPushSender() ?? noOpPushSender;
  const limit = options.limit ?? 200;

  let query = admin
    .from("notifications")
    .select("id,user_id,type,title,body,href")
    .is("pushed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (options.userIds?.length) query = query.in("user_id", options.userIds);

  const { data: pending } = await query;
  if (!pending?.length) return { pushed: 0 };

  const now = new Date().toISOString();
  let pushed = 0;

  for (const notification of pending) {
    const { data: profile } = await admin
      .from("profiles")
      .select("timezone,notification_preferences")
      .eq("id", notification.user_id)
      .single();

    const preferences = profile?.notification_preferences as
      NotificationPreferences | undefined;

    if (
      profile &&
      preferences &&
      shouldSendPush(preferences, now, profile.timezone)
    ) {
      const { data: devices } = await admin
        .from("devices")
        .select("id,endpoint,public_key,auth_secret")
        .eq("user_id", notification.user_id)
        .eq("enabled", true);

      for (const device of devices ?? []) {
        const result = await sender.send(
          {
            endpoint: device.endpoint,
            publicKey: device.public_key,
            authSecret: device.auth_secret,
          },
          {
            title: notification.title,
            body: notification.body,
            href: notification.href ?? undefined,
            tag: notification.type,
          },
        );
        if (result.ok) pushed += 1;
        else if (result.expired)
          await admin.from("devices").delete().eq("id", device.id);
      }
    }

    await admin
      .from("notifications")
      .update({ pushed_at: now })
      .eq("id", notification.id);
  }

  return { pushed };
}
