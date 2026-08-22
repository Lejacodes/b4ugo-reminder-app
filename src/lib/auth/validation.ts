/**
 * Input checks for the auth forms.
 *
 * These exist to give immediate, friendly feedback. They are NOT a security
 * boundary: anything accepted here is re-validated and enforced by the
 * authentication provider, which is the only authority on what is allowed.
 */
import { AuthError, type AuthErrorCode } from './errors';

/** Deliberately permissive — the provider's verification email is the real test. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt-based providers silently truncate past 72 bytes, so reject earlier. */
export const MAX_PASSWORD_LENGTH = 72;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function isAcceptablePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

/**
 * Returns the first problem with a sign-in form, or null when it can be sent.
 */
export function validateSignIn(email: string, password: string): AuthErrorCode | null {
  if (!isValidEmail(email)) return 'invalid-email';
  if (password.length === 0) return 'invalid-credentials';
  return null;
}

/**
 * Returns the first problem with an account-creation form, or null.
 */
export function validateCreateAccount(
  email: string,
  password: string,
  confirmPassword: string,
): AuthErrorCode | null {
  if (!isValidEmail(email)) return 'invalid-email';
  if (!isAcceptablePassword(password)) return 'weak-password';
  if (password !== confirmPassword) return 'password-mismatch';
  return null;
}

export function assertValidCredentials(email: string, password: string): void {
  const code = validateSignIn(email, password);
  if (code) throw new AuthError(code);
}
