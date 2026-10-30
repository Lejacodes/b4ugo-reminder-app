/**
 * Storage abstraction for user profile and preferences.
 *
 * Every key is scoped to an authenticated user id via `scopedKey`, so one
 * account's data can never be read as another's, and signing out leaves
 * nothing addressable behind.
 *
 * Growing record data is durable in SQLite on native and browser storage on
 * web. Credentials remain in SecureStore; these records are account-scoped but
 * are not secrets. Backend rows are still guarded by row-level security.
 */
import { recordStorage } from './record-storage-impl';
import type { RecordStorage } from './record-storage-contract';

const STORAGE_KEYS = {
  preferences: 'blugo.preferences',
  profile: 'blugo.profile',
  reminders: 'blugo.reminders',
  necessities: 'blugo.necessities',
  context: 'blugo.context',
  trips: 'blugo.trips',
  packingItems: 'blugo.packingItems',
  packingTemplates: 'blugo.packingTemplates',
  travelIntentions: 'blugo.travelIntentions',
  savedPlaces: 'blugo.savedPlaces',
  notificationLog: 'blugo.notificationLog',
  departureSession: 'blugo.departureSession',
  departureTriggerCooldown: 'blugo.departureTriggerCooldown',
  widgetBoard: 'blugo.widgetBoard',
} as const;

export type StorageKeyBase = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type PreferencesStorage = RecordStorage;

/** Namespaces a key to one authenticated account. */
export function scopedKey(base: StorageKeyBase, userId: string): string {
  return `${base}.${userId}`;
}

export const preferencesStorage: PreferencesStorage = recordStorage;

const RECORD_KEY_BASES: StorageKeyBase[] = [
  STORAGE_KEYS.profile,
  STORAGE_KEYS.preferences,
  STORAGE_KEYS.reminders,
  STORAGE_KEYS.necessities,
  STORAGE_KEYS.context,
  STORAGE_KEYS.trips,
  STORAGE_KEYS.packingItems,
  STORAGE_KEYS.packingTemplates,
  STORAGE_KEYS.travelIntentions,
  STORAGE_KEYS.savedPlaces,
  STORAGE_KEYS.notificationLog,
  STORAGE_KEYS.departureSession,
  STORAGE_KEYS.departureTriggerCooldown,
  STORAGE_KEYS.widgetBoard,
];

export function ensureLocalRecordsMigrated(userId: string) {
  return preferencesStorage.migrateUserSnapshot(
    userId,
    RECORD_KEY_BASES.map((base) => scopedKey(base, userId)),
  );
}
export function removeLocalAccount(userId: string) {
  return preferencesStorage.removeAccount(userId, RECORD_KEY_BASES.map((base) => scopedKey(base, userId)));
}
export { STORAGE_KEYS };
