/**
 * Persistence for the active session.
 *
 * Only provider-issued tokens and the identity they describe are written here,
 * into the platform keystore. Passwords are never an input to this module.
 *
 * Most hosted providers (Supabase, Clerk, Firebase) manage their own session
 * persistence and simply want a storage adapter — `sessionStorageAdapter`
 * below exposes `secureStorage` in the shape those SDKs expect, so this file
 * can be reduced to that adapter once a provider is wired up.
 */
import { secureStorage } from '@/lib/storage/secure-storage';

import type { AuthSession } from './types';

const SESSION_KEY = 'blugo.auth.session';

/** Treat a session as expired slightly early so requests don't race the clock. */
const EXPIRY_SKEW_MS = 30_000;

export function isSessionExpired(session: AuthSession, now = Date.now()): boolean {
  return session.expiresAt - EXPIRY_SKEW_MS <= now;
}

function parseSession(raw: string): AuthSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed?.accessToken !== 'string' ||
      typeof parsed?.expiresAt !== 'number' ||
      typeof parsed?.user?.id !== 'string' ||
      typeof parsed?.user?.email !== 'string'
    ) {
      return null;
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Reads the stored session. Expired or malformed entries are cleared and
 * reported as "no session" rather than surfaced as an error.
 */
export async function loadStoredSession(): Promise<AuthSession | null> {
  const raw = await secureStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  const session = parseSession(raw);
  if (!session || isSessionExpired(session)) {
    await clearStoredSession();
    return null;
  }

  return session;
}

export async function storeSession(session: AuthSession): Promise<void> {
  await secureStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await secureStorage.removeItem(SESSION_KEY);
}

export const sessionPersistsAcrossLaunches = secureStorage.isPersistent;

/**
 * Storage adapter in the `getItem`/`setItem`/`removeItem` shape that provider
 * SDKs accept for session persistence.
 */
export const sessionStorageAdapter = {
  getItem: (key: string) => secureStorage.getItem(key),
  setItem: (key: string, value: string) => secureStorage.setItem(key, value),
  removeItem: (key: string) => secureStorage.removeItem(key),
};
