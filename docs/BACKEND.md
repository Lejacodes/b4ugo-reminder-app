# Backend

Supabase is the backend. The Expo client only ever uses the project URL and publishable (anon) key.

Apply the schema from `supabase/README.md`.

| Concern | Module |
|---------|--------|
| Client | `src/lib/supabase/client.ts` |
| Auth | `src/lib/auth/supabase-client.ts` |
| Profile / prefs | `src/lib/api/profile-repository.ts` |
| Reminders / necessities / departure | `src/lib/api/reminder-repository.ts` |
| Trips / packing / templates / intentions | `src/lib/api/trip-repository.ts` |
| First-sync upload | `src/lib/api/migration.ts` |
| Geocoding | `src/lib/geocoding/open-meteo.ts` |
| Weather | `src/lib/weather/open-meteo.ts` |

UI providers are unchanged in shape. They still call `load*` / `save*` helpers; those helpers now sync remotely when Supabase is configured.
