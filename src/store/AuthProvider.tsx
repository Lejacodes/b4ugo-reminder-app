import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { authClient, toAuthError, type AuthSession, type AuthUser } from '@/lib/auth';
import { clearOpeningSession } from '@/lib/opening-session';

export type AuthStatus = 'restoring' | 'signed-out' | 'signed-in';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  /** True while a sign-in or account-creation request is in flight. */
  isSubmitting: boolean;
  /** False when no real provider is wired up — surfaced to developers only. */
  isProviderConfigured: boolean;
  createAccount: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session for the whole app.
 *
 * Credentials pass through `createAccount` / `signIn` into the client and are
 * never held in state, logged, or written anywhere. Failures are rethrown as
 * `AuthError` for the calling screen to render.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let restored: AuthSession | null = null;
      try {
        // An expired or unreadable session resolves to null rather than
        // throwing, so a bad entry lands the user on the opening window
        // instead of a crash.
        restored = await authClient.restoreSession();
      } catch {
        restored = null;
      }

      if (cancelled) return;
      setSession(restored);
      setStatus(restored ? 'signed-in' : 'signed-out');
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    async (request: () => Promise<AuthSession>) => {
      setIsSubmitting(true);
      try {
        const next = await request();
        if (!isMounted.current) return;
        setSession(next);
        setStatus('signed-in');
      } catch (error) {
        throw toAuthError(error);
      } finally {
        if (isMounted.current) setIsSubmitting(false);
      }
    },
    [],
  );

  const createAccount = useCallback(
    (email: string, password: string) =>
      submit(() => authClient.createAccount({ email, password })),
    [submit],
  );

  const signIn = useCallback(
    (email: string, password: string) => submit(() => authClient.signIn({ email, password })),
    [submit],
  );

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearOpeningSession();
      if (isMounted.current) {
        setSession(null);
        setStatus('signed-out');
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      isSubmitting,
      isProviderConfigured: authClient.isConfigured,
      createAccount,
      signIn,
      signOut,
    }),
    [status, session, isSubmitting, createAccount, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
