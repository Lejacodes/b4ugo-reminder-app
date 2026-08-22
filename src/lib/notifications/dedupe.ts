export type NotificationRecord = {
  key: string;
  at: number;
};

const DEFAULT_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export function notificationKey(reminderId: string, contextKey: string): string {
  return `${reminderId}::${contextKey}`;
}

export function shouldNotify(
  records: NotificationRecord[],
  key: string,
  now = Date.now(),
  cooldownMs = DEFAULT_COOLDOWN_MS,
): boolean {
  const previous = records.find((item) => item.key === key);
  if (!previous) return true;
  return now - previous.at >= cooldownMs;
}

export function rememberNotification(
  records: NotificationRecord[],
  key: string,
  now = Date.now(),
): NotificationRecord[] {
  return [...records.filter((item) => item.key !== key), { key, at: now }];
}

export function forgetKeys(records: NotificationRecord[], keys: string[]): NotificationRecord[] {
  const drop = new Set(keys);
  return records.filter((item) => !drop.has(item.key));
}
