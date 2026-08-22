/**
 * Resolves the app's `AuthClient`.
 *
 * INTEGRATION POINT — adding a real provider means one new client module and
 * one new branch in `createAuthClient()`. Nothing outside `src/lib/auth`
 * imports a provider SDK, so no screen has to change.
 *
 * Steps are written out in docs/AUTH.md.
 */
import { isSupabaseConfigured } from '@/lib/supabase/client';

import { AuthError } from './errors';
import { placeholderAuthClient } from './placeholder-client';
import { createSupabaseAuthClient } from './supabase-client';
import type { AuthClient, AuthSession } from './types';

/**
 * Stands in when a provider is named but unusable, or when a production build
 * has none at all. Failing loudly beats falling back to the placeholder and
 * letting anyone through.
 */
const unconfiguredAuthClient: AuthClient = {
  providerName: 'unconfigured',
  isConfigured: false,
  async restoreSession(): Promise<AuthSession | null> {
    return null;
  },
  async createAccount(): Promise<AuthSession> {
    throw new AuthError('provider-not-configured');
  },
  async signIn(): Promise<AuthSession> {
    throw new AuthError('provider-not-configured');
  },
  async signOut(): Promise<void> {},
};

function createAuthClient(): AuthClient {
  if (isSupabaseConfigured()) {
    return createSupabaseAuthClient();
  }

  // The placeholder accepts any password, so it is confined to development.
  return __DEV__ ? placeholderAuthClient : unconfiguredAuthClient;
}

export const authClient: AuthClient = createAuthClient();

export { AuthError, authErrorMessage, toAuthError, type AuthErrorCode } from './errors';
export {
  clearStoredSession,
  isSessionExpired,
  sessionPersistsAcrossLaunches,
} from './session-store';
export type { AuthSession, AuthUser, AuthUserId, Credentials } from './types';
export {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  validateCreateAccount,
  validateSignIn,
} from './validation';
