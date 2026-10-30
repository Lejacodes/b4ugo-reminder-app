# store

React context providers for app-wide state.

## Current

- **`PreferencesProvider.tsx`** — account-scoped profile/preferences and explicit onboarding choices.
- **`ReminderProvider.tsx`, `TripProvider.tsx`, `PlaceProvider.tsx`** — domain projections and durable commands.
- **`SyncProvider.tsx`** — active-session outbox drain/retry and visible synchronization state.
- **`NotificationDeliveryProvider.tsx`** — per-installation local/cloud due-delivery route.
- **`AuthProvider.tsx`** — account lifecycle and bounded device cleanup; the root remounts scoped providers on account/status changes.
- **`LittleGuyProvider.tsx`, `ContextIntelligenceProvider.tsx`, `PushNotificationProvider.tsx`** — assistant, location/notification effects and installation registration.

Persistence is abstracted via `src/lib/storage/` and `src/lib/sync/`: SQLite on native, locked browser storage on web, and a persistent versioned outbox. Providers publish successful local commits; pending remote synchronization is separate. Hosted/native acceptance remains open in `docs/IMPLEMENTATION_LOG.md`.
