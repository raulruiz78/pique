export interface NotificationPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
  quietStart: string;
  quietEnd: string;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function isWithinQuietHours(
  nowIso: string,
  quietStart: string,
  quietEnd: string,
  timezone: string,
): boolean {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const currentMinutes = toMinutes(formatter.format(new Date(nowIso)));
  const startMinutes = toMinutes(quietStart);
  const endMinutes = toMinutes(quietEnd);

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function shouldSendPush(
  preferences: NotificationPreferences,
  nowIso: string,
  timezone: string,
): boolean {
  if (!preferences.push) return false;
  return !isWithinQuietHours(
    nowIso,
    preferences.quietStart,
    preferences.quietEnd,
    timezone,
  );
}
