// Vibration API (docs/features/motion-system.md, 0.8.9.4): soportada en
// Chrome/Android, no en iOS Safari (ninguna PWA en iOS la tiene, instalada
// o no). Sin rama de UI distinta según soporte — en Android vibra, en iOS
// esta función simplemente no hace nada.
export function tap(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}
