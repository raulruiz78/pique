import webpush from "web-push";
import type { PushSender } from "./push";

export function createWebPushSender(): PushSender | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;

  webpush.setVapidDetails(subject, publicKey, privateKey);

  return {
    async send(subscription, payload) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.publicKey,
              auth: subscription.authSecret,
            },
          },
          JSON.stringify(payload),
        );
        return { ok: true };
      } catch (error) {
        const statusCode =
          error instanceof Error && "statusCode" in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;
        const expired = statusCode === 404 || statusCode === 410;
        return { ok: false, expired };
      }
    },
  };
}
