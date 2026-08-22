/**
 * Storage abstraction for user profile and preferences.
 *
 * Every key is scoped to an authenticated user id via `scopedKey`, so one
 * account's data can never be read as another's, and signing out leaves
 * nothing addressable behind.
 *
 * This is device-local and temporary. Profile and onboarding answers belong in
 * the backend, in rows owned by the authenticated user and guarded by
 * row-level security — see docs/AUTH.md. Until then the platform keystore
 * backs it, which keeps the local copy encrypted at rest for free.
 */
import { secureStorage, type SecureStorage } from './secure-storage';

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
} as const;

export type StorageKeyBase = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type PreferencesStorage = SecureStorage;

/** Namespaces a key to one authenticated account. */
export function scopedKey(base: StorageKeyBase, userId: string): string {
  return `${base}.${userId}`;
}

export const preferencesStorage: PreferencesStorage = secureStorage;
export { STORAGE_KEYS };
