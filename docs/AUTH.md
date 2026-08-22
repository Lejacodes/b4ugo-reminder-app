# Authentication & first-run flow

How BLUGO decides who someone is, and what still has to be built before real
people can use it.

Read alongside [SECURITY.md](./SECURITY.md).

---

## The flow

```
launch
  │
  ├─ stored session valid? ────────────────────────► Home (tabs)
  │
  └─ no session
       │
       ▼
   /opening            BLUGO window: "create account" / "log in"
       │
       ▼
   /auth/create-account   email + password + confirm
   /auth/sign-in          email + password
       │
       ▼  (account exists)
   /onboarding/name                "what should I call you?"
       │
       ▼
   /onboarding/getting-to-know-you  sticky-note interests, skippable
       │
       ▼
   Home (tabs)
```

Nothing personal is collected before authentication. The name and the
onboarding answers are profile rows attached to an account id, so a returning
user is never asked for them twice.

Routing is decided in one place: `src/hooks/use-session-guard.ts`.

---

## Current architecture

| Layer | File | State |
|-------|------|-------|
| Provider contract | `src/lib/auth/types.ts` | Ready |
| Error mapping | `src/lib/auth/errors.ts` | Ready |
| Form validation | `src/lib/auth/validation.ts` | Ready (UX only) |
| Encrypted storage | `src/lib/storage/secure-storage.ts` | Ready |
| Session persistence | `src/lib/auth/session-store.ts` | Ready |
| Provider config | `src/lib/auth/config.ts` | Ready, unconfigured |
| Client resolution | `src/lib/auth/index.ts` | Ready |
| **Identity itself** | `src/lib/auth/supabase-client.ts` | Real when env keys are set |
| Placeholder fallback | `src/lib/auth/placeholder-client.ts` | Dev only, if no Supabase keys |
| React session state | `src/store/AuthProvider.tsx` | Ready |
| Profile store | `src/store/PreferencesProvider.tsx` | Local cache + Supabase |

Only one box is a stand-in. Everything around it is written against the
`AuthClient` interface, so swapping the placeholder for a real provider
touches `src/lib/auth` and nothing else — no screen imports a provider SDK.

### What the placeholder does and does not do

`placeholder-client.ts` exists so the screens can be built and clicked
through. It is explicit about being useless:

- **It never checks a password.** Any password is accepted for any email.
- It never hashes, stores, or transmits one. The value is length-checked and
  dropped.
- Its `accessToken` is a random local string. No server has seen it and it
  authorises nothing.
- `isConfigured` is `false`, and `createAuthClient()` will not return it in a
  production build — release builds without a provider get a client that
  refuses every request instead.
- In development the auth screens show a dashed banner saying so.

Rolling our own password storage here would be worse than having none, so
there is none.

---

## Wiring up a real provider

1. Pick one. Supabase Auth, Clerk, and Firebase Auth are all pre-named in
   `config.ts`; any of them handles hashing, rate limiting, reset emails, and
   token rotation so we never touch a password.
2. `npx expo install <provider sdk>`.
3. Add `src/lib/auth/<provider>-client.ts` implementing `AuthClient`. Give it
   `sessionStorageAdapter` from `session-store.ts` so tokens land in the
   keychain rather than AsyncStorage.
4. Map the provider's errors onto `AuthErrorCode` inside that client. Sign-in
   and sign-up failures must both resolve to a vague message — a distinct
   "no such account" reply turns the login screen into an email checker.
5. Uncomment the matching branch in `createAuthClient()` (`src/lib/auth/index.ts`).
6. Set the environment variables below and delete `placeholder-client.ts`.

### Moving profile data to the backend

`PreferencesProvider` currently keeps profile and preferences on the device,
namespaced by user id. When the backend lands:

- Table `profiles`, primary key `user_id` referencing the auth user.
- Columns: `display_name`, `interests`, `created_at`, `updated_at`. No email,
  no password, no tokens — those stay with the auth provider.
- Row-level security on every operation: a row is readable and writable only
  by the account whose id matches it. Client-side scoping is convenience, not
  enforcement.
- Keep the local copy as a cache so the app opens without a round trip.

---

## Environment variables

All client-readable values must use the `EXPO_PUBLIC_` prefix and all of them
are **embedded in the shipped bundle**. Only publishable keys belong here.

```bash
# .env.local — gitignored, never committed
EXPO_PUBLIC_AUTH_PROVIDER=supabase

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# or Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# or Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
```

Never in this file, never in `app.json`, never in the repository:

- Supabase `service_role` key
- Firebase Admin credentials
- Clerk secret key
- Database connection strings
- Any API secret

Those belong on a server, or in EAS Secrets for build-time use.

---

## Session handling

- Tokens live in `expo-secure-store`: Keychain on iOS, Keystore-encrypted
  preferences on Android, accessible only after first unlock.
- Web has no keychain equivalent, so sessions are held in memory and lost on
  reload. `localStorage` is readable by any script on the page and is never
  used.
- Expiry is checked on restore with a 30-second margin. An expired or
  unreadable session is cleared and the user is returned to log in — no error
  screen.
- Sign-out clears the stored session and empties the profile store.
- The splash screen stays up until the session check finishes, so a returning
  user goes straight to Home without the opening window flashing past.

---

## Rules for this area

- Passwords exist only as a local `useState` value on the form that collects
  them. Nothing else reads, copies, or persists one.
- Nothing in `src/lib/auth` or `src/store/AuthProvider.tsx` logs. Not the
  email, not the token, not the error object.
- Only `AuthError` messages are rendered. Provider text never reaches a screen.
- Validation in `validation.ts` is for friendliness; the provider decides what
  is actually allowed.
