/**
 * Authentication failures, expressed as codes with user-safe messages.
 *
 * Messages here are the only auth text the UI is allowed to render. Provider
 * responses are never surfaced verbatim: they can leak whether an address is
 * registered, which rate limit was hit, or internal service detail.
 */

export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'password-mismatch'
  | 'invalid-credentials'
  | 'email-taken'
  | 'session-expired'
  | 'rate-limited'
  | 'network'
  | 'provider-not-configured'
  | 'unknown';

/**
 * Sign-in and account-creation failures share a deliberately vague message so
 * the screen cannot be used to enumerate which addresses have accounts.
 */
const MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-email': "that doesn't look like an email address.",
  'weak-password': 'passwords need at least 8 characters.',
  'password-mismatch': "those two passwords don't match.",
  'invalid-credentials': "that email and password don't match anything here.",
  'email-taken': "we couldn't create that account. try logging in instead.",
  'session-expired': 'you were signed out. please log in again.',
  'rate-limited': 'too many tries. give it a minute and come back.',
  network: "couldn't reach the server. check your connection.",
  'provider-not-configured': 'sign-in is not available in this build.',
  unknown: 'something went wrong. please try again.',
};

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(MESSAGES[code]);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthError ? error.message : MESSAGES.unknown;
}

/**
 * Normalises anything thrown by a provider SDK into an `AuthError`.
 * Unrecognised failures collapse to `unknown` rather than passing the original
 * message through, so provider internals never reach the screen.
 */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const record = error as { message?: string; code?: string; status?: number } | null;
  const code = (record?.code ?? '').toLowerCase();
  const message = (record?.message ?? '').toLowerCase();
  if (record?.status === 429 || code.includes('over_request') || message.includes('rate limit')) {
    return new AuthError('rate-limited');
  }
  if (code.includes('email_exists') || message.includes('already registered')) {
    return new AuthError('email-taken');
  }
  if (code.includes('invalid_credentials') || message.includes('invalid login')) {
    return new AuthError('invalid-credentials');
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return new AuthError('network');
  }
  return new AuthError('unknown');
}
