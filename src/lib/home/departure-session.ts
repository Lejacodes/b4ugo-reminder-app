import { todayIso } from '@/lib/trips/dates';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';

export type DepartureSession = {
  date: string;
  checks: Record<string, boolean>;
  dismissed: string[];
  /** Session check keys hidden after "Clear checked". Reset with the day / clearGoingTo. */
  cleared: string[];
};

export function emptyDepartureSession(date: string = todayIso()): DepartureSession {
  return { date, checks: {}, dismissed: [], cleared: [] };
}

export function normalizeDepartureSession(
  raw: DepartureSession | null | undefined,
  today: string,
): DepartureSession {
  if (!raw || raw.date !== today) return emptyDepartureSession(today);
  return {
    date: today,
    checks: raw.checks ?? {},
    dismissed: Array.isArray(raw.dismissed) ? raw.dismissed : [],
    cleared: Array.isArray(raw.cleared) ? raw.cleared : [],
  };
}

export async function loadDepartureSession(userId: string, today: string = todayIso()): Promise<DepartureSession> {
  try {
    const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.departureSession, userId));
    if (!raw) return emptyDepartureSession(today);
    return normalizeDepartureSession(JSON.parse(raw) as DepartureSession, today);
  } catch {
    return emptyDepartureSession(today);
  }
}

export async function saveDepartureSession(userId: string, session: DepartureSession): Promise<void> {
  await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.departureSession, userId), JSON.stringify(session));
}

export function sessionCheckKey(kind: 'nec' | 'wx', id: string): string {
  return `${kind}:${id}`;
}
