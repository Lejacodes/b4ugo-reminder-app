import { todayIso } from '@/lib/trips/dates';
import { ensureLocalRecordsMigrated, STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { localRepository } from '@/lib/sync/local';

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
  await ensureLocalRecordsMigrated(userId);
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.departureSession, userId));
  await localRepository.importDevice(userId, 'departureSession', raw ? JSON.parse(raw) : emptyDepartureSession(today));
  return normalizeDepartureSession(await localRepository.readDevice<DepartureSession>(userId, 'departureSession'), today);
}

export async function saveDepartureSession(userId: string, session: DepartureSession): Promise<void> {
  await localRepository.write(userId, [], { departureSession: session });
}

export function sessionCheckKey(kind: 'nec' | 'wx', id: string): string {
  return `${kind}:${id}`;
}
