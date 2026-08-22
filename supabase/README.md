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
