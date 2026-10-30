import { ensureLocalRecordsMigrated, preferencesStorage, scopedKey, STORAGE_KEYS } from '@/lib/storage/preferences-storage';
import { LocalRepository } from './repository';

const listeners = new Set<(userId: string) => void>();
export const localRepository = new LocalRepository(preferencesStorage, (userId) => listeners.forEach((listener) => listener(userId)));
export function subscribeLocalRecords(listener: (userId: string) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export type Collection = 'reminders' | 'necessities' | 'trips' | 'packingItems' | 'packingTemplates' | 'travelIntentions' | 'savedPlaces';
const entries = <T extends { id: string }>(items: T[]) => items.map((value) => ({ id: value.id, value }));

export async function readCollection<T extends { id: string }>(userId: string, collection: Collection): Promise<T[]> {
  await ensureLocalRecordsMigrated(userId);
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS[collection], userId));
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item.id !== 'string')) {
    throw new Error('Stored records need recovery; the original snapshot has been retained.');
  }
  await localRepository.import(userId, collection, entries(parsed));
  return localRepository.list<T>(userId, collection);
}

export async function writeCollection<T extends { id: string }>(userId: string, collection: Collection, after: T[], before?: T[]) {
  const baseline = before ?? await readCollection<T>(userId, collection);
  await localRepository.write(userId, [{ collection, before: entries(baseline), after: entries(after) }]);
}

export async function readSingleton<T>(userId: string, collection: 'context' | 'profile' | 'preferences'): Promise<T | null> {
  await ensureLocalRecordsMigrated(userId);
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS[collection], userId));
  await localRepository.import(userId, collection, raw ? [{ id: 'current', value: JSON.parse(raw) }] : []);
  return (await localRepository.list<T>(userId, collection))[0] ?? null;
}

export async function writeSingleton<T>(userId: string, collection: 'context' | 'profile' | 'preferences', value: T | null, before?: T | null) {
  const previous = before === undefined ? await readSingleton<T>(userId, collection) : before;
  await localRepository.write(userId, [{ collection,
    before: previous == null ? [] : [{ id: 'current', value: previous }],
    after: value == null ? [] : [{ id: 'current', value }] }]);
}

export function collectionChange<T extends { id: string }>(collection: Collection, before: T[], after: T[]) {
  return { collection, before: entries(before), after: entries(after) };
}
