"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isIOS, isStandalone } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePwaInstall {
  isInstalled: boolean;
  canPromptInstall: boolean;
  needsIOSInstructions: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

function subscribeToDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// navigator.userAgent no cambia en la vida de la pestaña: no hace falta
// reaccionar a nada, solo diferir la lectura hasta después de hidratar.
function subscribeNever() {
  return () => {};
}

export function usePwaInstall(): UsePwaInstall {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);

  const isStandaloneNow = useSyncExternalStore(
    subscribeToDisplayMode,
    isStandalone,
    () => false,
  );
  const isIOSDevice = useSyncExternalStore(subscribeNever, isIOS, () => false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setJustInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  };

  const isInstalled = isStandaloneNow || justInstalled;

  return {
    isInstalled,
    canPromptInstall: deferredPrompt !== null,
    needsIOSInstructions:
      !isInstalled && isIOSDevice && deferredPrompt === null,
    promptInstall,
  };
}
