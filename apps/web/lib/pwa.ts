export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorStandalone = (window.navigator as { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorStandalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
