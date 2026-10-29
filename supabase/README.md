# Supabase setup

1. Create a Supabase project.
2. In **Authentication → Providers**, keep Email enabled.
3. For local development, turn **off** "Confirm email" so sign-up returns a session immediately.
4. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
5. Copy the project URL and **anon / publishable** key into `.env.local`:

```
EXPO_PUBLIC_AUTH_PROVIDER=supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the service-role key in the Expo app.

Row Level Security is on for every user-owned table. Policies use `auth.uid()`.

## Little Guy (Gemini)

Little Guy's brain is Gemini 2.5 Flash-Lite, called only from `supabase/functions/little-guy`.

The Expo app never receives the Gemini key. If Gemini is unreachable, the on-device fallback keeps the app working.

1. Get a free key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Deploy the function and set the server secret (never `EXPO_PUBLIC_*`):

```
supabase functions deploy little-guy
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

Optional model override (default is already Flash-Lite):

```
supabase secrets set GEMINI_MODEL=gemini-2.5-flash-lite
```

3. The app calls this function automatically when Supabase is configured. You can also set:

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
