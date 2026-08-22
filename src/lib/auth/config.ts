/**
 * Where the authentication provider gets wired in.
 *
 * Only `EXPO_PUBLIC_*` variables are readable here, and everything with that
 * prefix is embedded in the shipped JavaScript bundle. That means this file
 * may reference publishable identifiers (a Supabase anon key, a Clerk
 * publishable key, a Firebase web config) and nothing else.
 *
 * Service-role keys, database URLs, admin credentials, and API secrets belong
 * on a server the client talks to — never in this file, never in app.json,
 * never in a committed .env. See docs/AUTH.md.
 */

export type AuthProviderId = 'none' | 'supabase' | 'clerk' | 'firebase';

const RAW_PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER ?? 'none';

const KNOWN_PROVIDERS: AuthProviderId[] = ['none', 'supabase', 'clerk', 'firebase'];

export const authProviderId: AuthProviderId = KNOWN_PROVIDERS.includes(
  RAW_PROVIDER as AuthProviderId,
)
  ? (RAW_PROVIDER as AuthProviderId)
  : 'none';

/**
 * Publishable values for the selected provider. Undefined until the matching
 * variables are set in .env.local (development) or EAS secrets (builds).
 */
export const authProviderConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  clerk: {
    publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  },
} as const;

export function isProviderConfigured(): boolean {
  if (authProviderConfig.supabase.url && authProviderConfig.supabase.anonKey) {
    return true;
  }
  switch (authProviderId) {
    case 'supabase':
      return Boolean(authProviderConfig.supabase.url && authProviderConfig.supabase.anonKey);
    case 'clerk':
      return Boolean(authProviderConfig.clerk.publishableKey);
    case 'firebase':
      return Boolean(
        authProviderConfig.firebase.apiKey && authProviderConfig.firebase.projectId,
      );
    case 'none':
    default:
      return false;
  }
}
