/**
 * ============================================================================
 * DEVELOPMENT PLACEHOLDER — THIS IS NOT AUTHENTICATION.
 * ============================================================================
 *
 * There is no authentication provider configured yet, so this stands in for
 * one to let the sign-up / sign-in / onboarding screens be built and tested.
 *
 * What it does NOT do, and must never be extended to do:
 *   - It does not verify passwords. Any password is accepted for any email.
 *   - It does not hash, salt, encrypt, compare, store, or transmit passwords.
 *     The `password` field is read only for a length check, then dropped.
 *   - It does not check whether an account already exists.
 *   - It does not issue real tokens. `accessToken` is a random local string
 *     that no server has ever seen and that authorises nothing.
 *
 * Rolling our own password storage here would be strictly worse than having
 * none, so it stays absent. Replace this whole file with a real provider
 * client (see docs/AUTH.md) before this app touches a real user's email.
 *
 * `isConfigured` is false and `createAuthClient()` refuses to hand this out in
 * a production build, so shipping it cannot silently let people "log in".
 */
import { AuthError } from './errors';
import { clearStoredSession, loadStoredSession, storeSession } from './session-store';
import type { AuthClient, AuthSession, Credentials } from './types';
import { isAcceptablePassword, isValidEmail, normalizeEmail } from './validation';

const PLACEHOLDER_SESSION_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Derives a stable local id from an email so a developer signing in again
 * lands back on the same locally-stored profile. This is a convenience for
 * development only — a real provider assigns the id, and it is not derived
 * from personal data.
 */
function localIdForEmail(email: string): string {
  let fnv = 0x811c9dc5;
  let djb = 5381;

  for (let i = 0; i < email.length; i += 1) {
    const char = email.charCodeAt(i);
    fnv = Math.imul(fnv ^ char, 0x01000193) >>> 0;
    djb = ((djb << 5) + djb + char) >>> 0;
  }

  return `local-${fnv.toString(16).padStart(8, '0')}${djb.toString(16).padStart(8, '0')}`;
}

function randomToken(): string {
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0'),
  ).join('');
}

function buildSession(email: string): AuthSession {
  const now = Date.now();
  return {
    user: {
      id: localIdForEmail(email),
      email,
      emailVerified: false,
      createdAt: new Date(now).toISOString(),
    },
    accessToken: randomToken(),
    refreshToken: null,
    expiresAt: now + PLACEHOLDER_SESSION_MS,
  };
}

/** Mimics provider latency so loading and disabled states get exercised. */
function pause(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class PlaceholderAuthClient implements AuthClient {
  readonly providerName = 'local placeholder (development only)';
  readonly isConfigured = false;

  async restoreSession(): Promise<AuthSession | null> {
    return loadStoredSession();
  }

  async createAccount({ email, password }: Credentials): Promise<AuthSession> {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) throw new AuthError('invalid-email');
    if (!isAcceptablePassword(password)) throw new AuthError('weak-password');

    await pause();
    const session = buildSession(normalized);
    await storeSession(session);
    return session;
  }

  async signIn({ email, password }: Credentials): Promise<AuthSession> {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) throw new AuthError('invalid-email');
    if (password.length === 0) throw new AuthError('invalid-credentials');

    await pause();
    const session = buildSession(normalized);
    await storeSession(session);
    return session;
  }

  async signOut(): Promise<void> {
    await clearStoredSession();
  }
}

export const placeholderAuthClient: AuthClient = new PlaceholderAuthClient();
