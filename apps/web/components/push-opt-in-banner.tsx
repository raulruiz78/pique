"use client";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { usePushSubscription } from "@/hooks/use-push-subscription";

const DISMISS_KEY = "pique.pushBannerDismissed";

function subscribeToDismissal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readDismissed() {
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

interface NotificationPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
  quietStart: string;
  quietEnd: string;
}

// Antes, activar el push solo se podía descubrir entrando a Perfil →
// Notificaciones — nadie llega ahí espontáneamente, así que casi nadie lo
// activaba (notification_preferences.push nace en false para todo el
// mundo). Este aviso lo ofrece donde sí se ve, igual que el de instalar la
// PWA — y deliberadamente nunca a la vez que ese: uno detrás de otro, no
// los dos compitiendo por atención.
export function PushOptInBanner({
  preferences,
}: {
  preferences: NotificationPreferences | null;
}) {
  const router = useRouter();
  const { isInstalled, canPromptInstall, needsIOSInstructions } =
    usePwaInstall();
  const { status, subscribe } = usePushSubscription();
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    readDismissed,
    () => true,
  );

  const installBannerShowing =
    !isInstalled && (canPromptInstall || needsIOSInstructions);

  if (
    !preferences ||
    preferences.push ||
    dismissed ||
    installBannerShowing ||
    status === "subscribed"
  )
    return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new StorageEvent("storage"));
  };

  async function enable() {
    const subscribed = await subscribe();
    if (!subscribed) return;
    await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationPreferences: { ...preferences, push: true },
      }),
    });
    dismiss();
    router.refresh();
  }

  return (
    <div className="card install-banner">
      <button
        type="button"
        className="install-banner-dismiss"
        aria-label="Cerrar aviso de notificaciones"
        onClick={dismiss}
      >
        <X size={16} />
      </button>
      <div className="install-banner-icon">
        <Bell size={20} />
      </div>
      <div>
        <p className="install-banner-title">Activa los avisos</p>
        <p className="muted install-banner-body">
          Entérate al momento cuando te reten o validen tu prueba.
        </p>
      </div>
      <button
        type="button"
        className="button button-primary install-banner-action"
        disabled={status === "subscribing"}
        onClick={() => void enable()}
      >
        Activar
      </button>
    </div>
  );
}
