# B4UGO Security & Privacy

This document establishes security and privacy principles for B4UGO.
It describes what is protected **today** and what will be implemented in later phases.

> **Important:** Documenting a plan is not the same as implementing protection.
> Sections marked "Future" are not yet enforced in code.

---

## Security goals

1. **Protect user data** — reminders, locations, routines, and preferences are sensitive.
2. **Minimize attack surface** — no unnecessary network calls, SDKs, or permissions.
3. **Secure by default** — privacy-preserving defaults; opt-in for sensitive features.
4. **No secrets in source code** — ever.
5. **Prepare for auth** — architecture should support authenticated sessions later.

## Privacy goals

1. **Data minimization** — collect only what materially improves the product.
2. **Purpose limitation** — use data only for the feature the user expects.
3. **Transparency** — tell users why data is collected before requesting it.
4. **User control** — preferences for notifications, location, AI, and analytics.
5. **No silent tracking** — no analytics or third-party tracking SDKs in Phase 1–2.

---

## What data the app currently stores

| Data | Fields | Where | Persists across restarts? |
|------|--------|-------|---------------------------|
| Session | provider tokens, user id, email | `expo-secure-store` (Keychain / Keystore) | **Yes** on device; no on web |
| User profile | `displayName`, `interests`, timestamps | `expo-secure-store`, namespaced by user id | **Yes** on device; no on web |
| User preferences | notification/reminder/privacy flags, onboarding state | `expo-secure-store`, namespaced by user id | **Yes** on device; no on web |

Storage abstractions: `src/lib/storage/secure-storage.ts` (keystore-backed,
memory on web) and `src/lib/storage/preferences-storage.ts` (user-scoped keys
on top of it).

Profile and preferences are not secret, but the keystore is the only
persistent store wired up and encrypting them costs nothing. They move to
backend rows under row-level security when the backend lands — see
[AUTH.md](./AUTH.md).

### What is intentionally NOT collected

- Passwords — no password is ever stored, hashed, or transmitted by this app
- Location coordinates or geofence data
- Reminder content beyond the device
- Device identifiers for tracking
- Analytics events
- AI conversation history
- Contacts, calendar, or photos

Email is collected, because an account needs one. Nothing else about a person
is asked for: onboarding takes eight coarse interest tags, all optional and
all skippable.

### Permissions intentionally not requested yet

- Push notifications
- Location / background location
- Camera / microphone
- Contacts / calendar

Onboarding collects **preference intentions only** — no OS permission dialogs.

---

## What is protected today

| Area | Status |
|------|--------|
| Secrets in source code | ✅ None committed; all `.env*` except `.env.example` gitignored |
| Analytics / tracking | ✅ Not implemented |
| Location tracking | ✅ Not implemented |
| Push notifications | ✅ Not implemented (preference flags only) |
| Password storage | ✅ None. Delegated to a provider by design; see AUTH.md |
| Local data encryption | ✅ Keychain / Keystore via `expo-secure-store` |
| Token storage | ✅ Keystore only; never AsyncStorage or localStorage |
| Per-account data isolation | ✅ Local keys namespaced by authenticated user id |
| Authentication | ⚠️ Architecture in place, **provider not connected** |
| Backend / API | ⚠️ Not implemented — no server-side authorization yet |
| AI data processing | ✅ Not implemented (preference flag only) |

> The authentication **abstraction** is real; the **identity check** is not.
> `src/lib/auth/placeholder-client.ts` accepts any password and is barred from
> production builds. This app is not ready for real accounts until a provider
> is connected.

---

## Secrets management

### Rules

- **Never** commit API keys, tokens, passwords, or credentials to the repository.
- Store secrets in environment variables loaded from `.env` files.
- Every `.env*` file is gitignored except `.env.example`, which holds
  placeholders only.
- `EXPO_PUBLIC_*` variables are **embedded in the shipped bundle**. Only
  publishable identifiers may use that prefix. A service-role key, admin
  credential, or database URL with that prefix is a leak.
- Use platform-specific secret stores for production:
  - **EAS Secrets** for Expo build-time variables
  - **iOS Keychain / Android Keystore** for runtime secrets on device

### Current state

No secrets are in use and no `.env` file exists. `.env.example` documents the
authentication variables that will be needed — see
[AUTH.md](./AUTH.md#environment-variables) for the full list.

---

## Authentication

Full detail in [AUTH.md](./AUTH.md). Summary of the standing rules:

- Password handling is delegated to a reputable provider. This codebase never
  hashes, compares, or stores one, and must not start.
- Session tokens live in **expo-secure-store**, never AsyncStorage or
  localStorage.
- Expired sessions are cleared silently and the user is asked to log in again.
- Sign-in and sign-up failures share one vague message so the screens cannot
  be used to discover which addresses have accounts.
- Client-side validation is for friendliness only. The provider is the
  authority on what is accepted.
- Authentication happens before any personal data is requested.

**Provider not yet connected** — a development placeholder stands in and is
blocked from production builds.

---

## Authorization (Future)

- Server-side authorization for all API endpoints
- Row-level security keyed on the authenticated user id, so a row is readable
  and writable only by its owner
- Users can only access their own reminders, places, and routines
- Client-side scoping (as done today in `PreferencesProvider`) is convenience,
  never enforcement

**Not implemented** — there is no backend yet.

---

## Local storage security

### Current

| Data type | Storage | Rationale |
|-----------|---------|-----------|
| Session tokens | expo-secure-store | Encrypted, hardware-backed |
| User profile | expo-secure-store, scoped by user id | Only persistent store available; free encryption |
| User preferences | expo-secure-store, scoped by user id | Same |

On web there is no keychain, so all of the above fall back to memory and are
lost on reload. That is deliberate: `localStorage` is readable by any script
on the page.

### Planned

| Data type | Storage | Rationale |
|-----------|---------|-----------|
| User profile & preferences | Backend rows under RLS, cached locally | Follows the account, not the device |
| Reminder content | AsyncStorage or SQLite | Local-first, encrypted at rest (TBD) |
| Location coordinates | SecureStore or encrypted DB | Sensitive |

---

## Notification privacy (Future)

- Notification content should not expose sensitive details on lock screen unless user opts in
- Quiet hours respected locally before sending to notification service
- No notification content sent to third-party analytics

---

## Location privacy (Future)

- Location permission requested **only** when user creates a location-based reminder
- Coordinates stored locally; server sync only with explicit consent
- No background location tracking without clear user understanding
- Geofence radius minimized to what's needed

---

## AI / data privacy (Future)

- Natural-language input processed with user consent (`aiParsingEnabled` preference)
- Minimize data sent to AI providers — strip unnecessary context
- No training on user data without explicit opt-in
- Document which third-party AI services are used and their data policies

---

## Backend security requirements (Future)

When a backend is added:

- HTTPS only (TLS 1.2+)
- Input validation on all endpoints
- Rate limiting
- Authentication on all user-data endpoints
- Parameterized queries (no SQL injection)
- CORS restricted to known origins
- Security headers (HSTS, CSP where applicable)
- Dependency vulnerability scanning in CI
- Regular dependency updates

---

## Dependency & update expectations

- Run `npm audit` periodically; address moderate+ vulnerabilities
- Keep Expo SDK and dependencies current within stable releases
- Review changelogs before major upgrades
- Do not add third-party SDKs without privacy/security review

---

## Logging rules

- **Never log** passwords, tokens, API keys, or full reminder content in production
- Use log levels appropriately (debug logs stripped in production builds)
- Crash reports should scrub PII before transmission
- No logging to third-party services without user consent

---

## Sensitive data handling

| Data | Classification | Handling |
|------|---------------|----------|
| Display name | Low | Local storage OK |
| Email address | Medium | Held by the auth provider; never logged |
| Passwords | Critical | Never stored, hashed, or logged by this app |
| Reminder text | Medium–High | Encrypt at rest when persisted |
| Location coordinates | High | SecureStore / encrypted storage |
| Auth tokens | Critical | SecureStore only |
| AI prompts | Medium | Minimize retention; no logging |

---

## Reporting

If you discover a security issue, do not open a public GitHub issue.
Contact the project maintainer directly.

---

## Revision history

See [CHANGELOG.md](./CHANGELOG.md) for when security-relevant changes were made.
