# Supabase setup

## Reliability cutover — Phase 1 checkpoint

The client now requires migrations **0001 through 0004**. Run `npm run test:database` and `npm run test:push`, then select an isolated project and backup before hosted tests. Migration 0003 backfills canonical versioned records and revokes the old direct-write protocol; retire old binaries/cron during cutover. Migration 0004 adds installation-specific tokens, due-delivery routes and delivery attempts. No hosted migration has been performed during this checkpoint.

Deno-check/deploy `due-reminder-push` after the schema. Configure a separate 32+-character `PUSH_SCHEDULER_SECRET`; schedule a once-per-minute POST with `x-cron-secret` and the gateway Authorization bearer token when JWT verification is enabled. Keep both credentials server-side. The sender verifies individual Expo tickets, processes receipts, removes invalid tokens and retains unknown submission outcomes without blindly resending them.

On-device due scheduling is default. Cloud due delivery is chosen explicitly in Profile → Diagnostics after registration, and needs an EAS UUID and APNs/FCM credentials. No live deployment/push/device result is claimed. Follow `docs/IMPLEMENTATION_LOG.md` and `docs/TESTING.md` before release.

## Foundation setup

1. Create a Supabase project.
2. In **Authentication → Providers**, keep Email enabled.
3. For local development, turn **off** "Confirm email" so sign-up returns a session immediately.
4. Apply all four migrations in order in the isolated fixture project; follow the cutover notes above before production deployment.
5. Copy the project URL and **anon / publishable** key into `.env.local`:

```
EXPO_PUBLIC_AUTH_PROVIDER=supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the service-role key in the Expo app.

Row Level Security is on for every user-owned table. Policies use `auth.uid()`.

## Little Guy (Gemini)

The Edge Function defaults to Gemini 3.5 Flash-Lite (overridable with `GEMINI_MODEL`); the client also supports the documented local development proxy.

The Expo app never receives the Gemini key. If Gemini is unreachable, the on-device fallback keeps the app working.

1. Get a free key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Deploy the function and set the server secret (never `EXPO_PUBLIC_*`):

```
supabase functions deploy little-guy
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

Optional model override (confirm availability before changing it):

```
supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite
```

3. The app calls this function only when cloud AI is explicitly enabled during onboarding or in Profile. You can also set:

```
EXPO_PUBLIC_AI_API_URL=supabase
```

The function only talks to Gemini. Reminders, trips, packing, and places still go through the app's validated tool layer and existing stores.

## Account deletion

Deploy the authenticated deletion function before distributing a build:

```
supabase functions deploy delete-account
```

Supabase supplies the URL, anon key, and service-role key to the function environment. The client never receives the service-role key. The function verifies the caller's bearer token before deleting that same user; database rows are removed by the existing `ON DELETE CASCADE` foreign keys.
