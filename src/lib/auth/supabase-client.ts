import type { Session } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase/client';

import { AuthError } from './errors';
import type { AuthClient, AuthSession } from './types';

function mapSupabaseAuthError(error: { message?: string; code?: string; status?: number }): AuthError {
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();
  const status = error.status;

  if (status === 429 || code.includes('over_request') || message.includes('rate')) {
    return new AuthError('rate-limited');
  }
  if (code.includes('email_exists') || message.includes('already registered')) {
    return new AuthError('email-taken');
  }
  if (
    code.includes('invalid_credentials') ||
    code.includes('invalid_grant') ||
    message.includes('invalid login') ||
    message.includes('invalid credentials')
  ) {
    return new AuthError('invalid-credentials');
  }
  if (code.includes('weak_password') || message.includes('password')) {
    if (message.includes('weak') || message.includes('least') || message.includes('characters')) {
      return new AuthError('weak-password');
    }
  }
  if (message.includes('network') || message.includes('fetch') || status === 0) {
    return new AuthError('network');
  }
  return new AuthError('unknown');
}

function toAuthSession(session: Session): AuthSession {
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 60 * 60 * 1000;
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      emailVerified: Boolean(session.user.email_confirmed_at),
      createdAt: session.user.created_at,
    },
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt,
  };
}

export function createSupabaseAuthClient(): AuthClient {
  return {
    providerName: 'supabase',
    isConfigured: true,

    async restoreSession() {
      const supabase = getSupabase();
      if (!supabase) return null;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) return null;
        return toAuthSession(data.session);
      } catch {
        return null;
      }
    },

    async createAccount(credentials) {
      const supabase = getSupabase();
      if (!supabase) throw new AuthError('provider-not-configured');

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw mapSupabaseAuthError(error);
      if (data.session) return toAuthSession(data.session);

      const signedIn = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (signedIn.error) throw mapSupabaseAuthError(signedIn.error);
      if (!signedIn.data.session) throw new AuthError('unknown');
      return toAuthSession(signedIn.data.session);
    },

    async signIn(credentials) {
      const supabase = getSupabase();
      if (!supabase) throw new AuthError('provider-not-configured');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw mapSupabaseAuthError(error);
      if (!data.session) throw new AuthError('invalid-credentials');
      return toAuthSession(data.session);
    },

    async signOut() {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  };
}
