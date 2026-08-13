"use client";
import { Download, Share, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "pique.installBannerDismissed";

function subscribeToDismissal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readDismissed() {
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function InstallBanner() {
  const { isInstalled, canPromptInstall, needsIOSInstructions, promptInstall } =
    usePwaInstall();
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    readDismissed,
    () => true,
  );

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new StorageEvent("storage"));
  };

  if (isInstalled || dismissed || (!canPromptInstall && !needsIOSInstructions))
    return null;

  return (
    <div className="card install-banner">
      <button
        type="button"
        className="install-banner-dismiss"
        aria-label="Cerrar aviso de instalación"
        onClick={dismiss}
      >
        <X size={16} />
      </button>
      <div className="install-banner-icon">
        <Download size={20} />
      </div>
      <div>
        <p className="install-banner-title">Instala Pique</p>
        {canPromptInstall ? (
          <p className="muted install-banner-body">
            Accede más rápido y recibe avisos como una app.
          </p>
        ) : (
          <p className="muted install-banner-body">
            Toca <Share size={14} style={{ verticalAlign: "-2px" }} /> y luego
            «Añadir a pantalla de inicio».
          </p>
        )}
      </div>
      {canPromptInstall ? (
        <button
          type="button"
          className="button button-primary install-banner-action"
          onClick={() => void promptInstall()}
        >
          Instalar
        </button>
      ) : null}
    </div>
  );
}
