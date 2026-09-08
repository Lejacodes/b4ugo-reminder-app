const ALLOWED_PREFIXES = [
  '/reminders',
  '/before-ugo',
  '/on-the-way-back',
  '/trip/',
  '/(tabs)',
  '/(tabs)/reminders',
  '/(tabs)/on-the-way-back',
  '/(tabs)/trips',
];

export function hrefFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const href = (data as { href?: unknown }).href;
  if (typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.includes('://') || trimmed.includes('..')) return null;
  if (!ALLOWED_PREFIXES.some((prefix) => trimmed === prefix || trimmed.startsWith(prefix))) {
    return null;
  }
  return trimmed;
}

export function hrefForDueReminder(item: {
  category: string;
  contextId?: string | null;
}): string {
  if (item.category === 'onTheWayBack') return '/on-the-way-back';
  if (item.category === 'beforeUgo') return '/before-ugo';
  if (item.contextId && item.contextId.startsWith('trip-')) return `/trip/${item.contextId}`;
  return '/(tabs)';
}

export function dueNotificationId(reminderId: string, dueAt?: string | null): string {
  return dueAt ? `due:${reminderId}:${dueAt}` : `due:${reminderId}`;
}

export function isDueNotificationId(identifier: string): boolean {
  return identifier.startsWith('due:');
}
