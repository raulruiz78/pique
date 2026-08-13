"use client";
import { useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1)
    bytes[index] = raw.charCodeAt(index);
  return bytes;
}

type PushSubscriptionStatus =
  "idle" | "subscribing" | "subscribed" | "unsupported" | "denied" | "error";

export function usePushSubscription() {
  const [status, setStatus] = useState<PushSubscriptionStatus>("idle");

  async function subscribe(): Promise<boolean> {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !vapidKey
    ) {
      setStatus("unsupported");
      return false;
    }
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = subscription.toJSON();
      const response = await fetch("/api/v1/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          publicKey: json.keys?.p256dh,
          authSecret: json.keys?.auth,
        }),
      });
      if (!response.ok) {
        setStatus("error");
        return false;
      }
      setStatus("subscribed");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await fetch("/api/v1/devices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    setStatus("idle");
  }

  return { status, subscribe, unsubscribe };
}
