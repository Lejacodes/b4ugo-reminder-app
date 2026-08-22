# B4UGO Data Model (Phase 2)

Minimal, extensible TypeScript types for personal context. Defined in `src/types/`.

## Design principles

1. **Minimal fields** — only what Phase 2 needs; extend later without breaking changes
2. **No fake IDs from backend** — local UUIDs generated client-side until auth exists
3. **Preferences vs profile** — identity separate from behavioral settings
4. **Privacy defaults** — analytics off, AI off, location off until user opts in

---

## UserProfile

```typescript
type UserProfile = {
  displayName: string | null;
  createdAt: string;   // ISO 8601
  updatedAt: string;
};
```

**Deferred:** `userId`, `email`, `avatarUrl` (require authentication)

---

## UserPreferences

Aggregates three preference groups plus onboarding state:

```typescript
type UserPreferences = {
  notifications: NotificationPreferences;
  reminders: ReminderPreferences;
  privacy: PrivacyPreferences;
  hasCompletedOnboarding: boolean;
};
```

### NotificationPreferences

Intention flags only — no OS permission integration yet.

| Field | Default | Notes |
|-------|---------|-------|
| `pushEnabled` | `true` | User intent; permission requested later |
| `quietHoursEnabled` | `false` | |
| `quietHoursStart` | `null` | 24h format, e.g. `"22:00"` |
| `quietHoursEnd` | `null` | e.g. `"07:00"` |

### ReminderPreferences

| Field | Default | Notes |
|-------|---------|-------|
| `preferContextual` | `true` | Context over fixed-time |
| `locationRemindersEnabled` | `false` | Requires future location permission |
| `routineRemindersEnabled` | `true` | |

### PrivacyPreferences

| Field | Default | Notes |
|-------|---------|-------|
| `analyticsEnabled` | `false` | Not implemented |
| `aiParsingEnabled` | `false` | Not implemented |

---

## Place

For future location-based reminders.

```typescript
type Place = {
  id: string;
  name: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
};
```

**Deferred:** `latitude`, `longitude`, `radius`, `geofenceId`

---

## Routine

For future routine-attached reminders.

```typescript
type Routine = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
};
```

**Deferred:** `schedule`, `triggers`, `linkedPlaceId`

---

## Storage

Currently in-memory via `PreferencesProvider`. Only `UserProfile` and `UserPreferences` are persisted to the storage abstraction.

Places and routines will get their own storage keys when CRUD UI is built.

See `docs/SECURITY.md` for storage security classification.
