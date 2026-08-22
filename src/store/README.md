# store

React context providers for app-wide state.

## Current

- **`PreferencesProvider.tsx`** — user profile and preferences (Phase 2)

## Future

- Reminder data store (local-first, synced to backend)
- Place and routine collections

Persistence is abstracted via `src/lib/storage/`. The current implementation is in-memory only.
