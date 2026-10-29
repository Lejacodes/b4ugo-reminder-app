/**
 * Authentication contracts for BLUGO.
 *
 * These types describe what the app needs from an authentication provider.
 * They deliberately contain no password fields beyond the transient input
 * objects that are handed straight to the provider and never retained.
 *
 * See docs/AUTH.md for the provider integration checklist.
 */

/** Stable identifier issued by the authentication provider. */
export type AuthUserId = string;

/**
 * The authenticated identity. This is credential-adjacent data and is kept
 * separate from `UserProfile`, which holds app content the user can edit.
 */
export type AuthUser = {
  id: AuthUserId;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

/**
 * An active session. Tokens are opaque strings issued by the provider —
 * never a password, never a password derivative.
 */
export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string | null;
  /** Epoch milliseconds. Sessions past this point must be re-established. */
  expiresAt: number;
};

/**
 * Credentials in transit. Instances are short-lived: created in a form
 * handler, passed to the provider, then dropped. Never persist one.
 */
export type Credentials = {
  email: string;
  password: string;
};

/**
 * The seam between BLUGO and whichever authentication service backs it.
 *
 * Implementations must not hash, compare, or store passwords themselves —
 * `password` is forwarded to the provider over TLS and discarded.
 */
export interface AuthClient {
  /** Human-readable provider name, used in developer-facing messaging only. */
  readonly providerName: string;

  /**
   * Whether a real provider is wired up. When false the app is running
   * against the local placeholder and must not be shipped to users.
   */
  readonly isConfigured: boolean;

  /** Returns a still-valid stored session, or null. Never throws for "no session". */
  restoreSession(): Promise<AuthSession | null>;

  createAccount(credentials: Credentials): Promise<AuthSession>;

  signIn(credentials: Credentials): Promise<AuthSession>;

  signOut(): Promise<void>;

  /** Permanently removes the provider account and associated user data. */
  deleteAccount(): Promise<void>;
}
