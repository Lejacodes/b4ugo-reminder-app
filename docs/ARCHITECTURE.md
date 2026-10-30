# B4UGO architecture

## Current reliability architecture — 2026-10-30

This section supersedes the historical Phase 0 persistence/sync/delivery/onboarding descriptions retained below. The revised phase order and acceptance state are in IMPROVEMENT_PLAN and IMPLEMENTATION_LOG.

The root is `Auth → account-keyed Sync → NotificationDelivery → Preferences → Appearance → Reminder → Trip → Place → LittleGuy → ContextIntelligence → PushNotification → Navigator`. Changing auth status/account remounts scoped providers before logout cleanup; account guards reject outgoing callbacks. Confirmed account deletion stops/drains local mutations and erases scoped records/recovery data. Sign-out retains account-scoped offline records for the same user.

Native `record-storage` opens `b4ugo-records.db` with WAL and bound key/value SQL. Exclusive migration imports scoped SecureStore keys, verifies counts/checksums and atomically commits its marker. Failed reads reject/retry; source copies remain for recovery. Credentials remain in SecureStore. Web uses localStorage plus Web Locks; unavailable storage/locks reject saves, and SSR cannot pretend to persist in memory.

`sync/repository.ts` owns `blugo.sync.v1.<userId>`, an envelope containing per-record values/versions/tombstones, operation IDs, import markers, recovery counts and device-only departure checks. One value commit atomically saves domain edits and the outbox. Trip/packing creation, trip/children deletion, departure/context changes and necessity/session cleanup share this boundary. Providers publish state after commit. Creation results distinguish persisted/unchanged; failure rejects. Shared scrapbook actions retain announced errors until retry; Add and trip forms retain drafts. Little Guy success waits for service results.

`sync/local.ts` imports scoped collections once and rejects malformed snapshots. Stores and legacy API facades delegate here; destructive server collection replacement and unowned snapshot uploads were removed. Sync drains at launch, foreground, reconnect and a 15-second active timer, with at most 50 attempts/three failures per drain, backoff capped at five minutes and 15-second transport aborts. Background synchronization is not guaranteed.

The server RPC checks authenticated ownership, input bounds, operation IDs, expected revisions and parent ownership. Receipts commit with mutations. Migration 0003 backfills legacy rows, retains old source tables and retires their direct-write protocol. Pulls paginate and include explicit tombstones; remote absence never deletes local data. A conflict retains both copies and stops that record. Confirmed remote-version selection creates local recovery evidence; automatic field merging and an automated local-proposal replay are not implemented. Retention/compaction remains a release consideration.

Onboarding is name → interests → permissions/privacy → complete. New notification/location/AI choices start off. Permission explanations precede explicit feature actions; background location is separate. Mounting maps, searching places and background providers do not request location automatically. Unsupported quiet-hours fields were removed.

Each installation selects local or cloud due delivery; local scheduling is default. Diagnostics can switch routes after token registration/server coordination and cancel local due schedules for cloud mode. The sender ignores local-mode tokens. Interruption across this server/local/OS handoff remains a required device test. Location and Wi-Fi hints are separate triggers. Push registration/removal uses a persistent installation ID and retries on reconnect, token rotation and an active minute timer. Logout cleanup is bounded at five seconds per step; offline deregistration remains best effort.

Geofence replacement/cleanup is serialized, supports first registration and caps regions at 20 iOS/100 Android. Tasks recheck the manifest before scheduling. The scheduled sender requires `x-cron-secret`, claims per-token attempts in SQL and checks individual Expo tickets before marking accepted. Receipt success marks delivered (upstream acceptance, not user observation); invalid tokens are removed. Unknown submission responses become uncertain and are not blindly resent. Catch-up is bounded to 24 hours; future reminders are not sent early. Remote text is generic.

Profile → `/diagnostics` shows sync/conflict/recovery counts, notification/location permissions, schedules, geofence status/manifest count, EAS project ID, installation registration, AI opt-in and delivery route, with retries/settings/confirmed conflict selection. It does not infer deployment from config.

Migrations 0003/0004 and the revised sender are not deployed to a hosted project. SQLite/PostgreSQL/injected-handler tests pass; native OS behavior and APNs/FCM remain unverified. SDK 57 config resolves with SQLite but lacks an EAS project ID. Native projects need autolinking/rebuild. Exact cutover/device gates are in IMPLEMENTATION_LOG and TESTING. Later daily/AI/voice/Calm/care-partner/travel phases remain gated.

## Historical Phase 0 inventory — 2026-10-29

Current source baseline, 2026-10-29 (`176799b`), Expo SDK 57 / React Native 0.86 / React 19.2.3. This describes implemented paths, not a guarantee of deployed services or durable delivery. Planned changes are in [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md); open findings are in [BASELINE_AUDIT.md](BASELINE_AUDIT.md).

## State ownership

`src/app/_layout.tsx` loads Fraunces, imports the geofence task at module scope, installs gesture/safe-area roots and composes providers in this order:

```text
Auth → Preferences → Appearance → Reminder → Trip → Place
     → LittleGuy → ContextIntelligence → PushNotification → RootNavigator
```

| Provider (`src/store/`) | Owns / dependencies | Persistence and effects |
| --- | --- | --- |
| AuthProvider | session, status, submission; `lib/auth` client | Supabase/placeholder restore and login; cleanup before sign-out/deletion; no auth-state subscription |
| PreferencesProvider | profile, preferences, onboarding; Auth | user-scoped local JSON, profile repository, legacy first-sync migration; resets on signed-out |
| AppearanceProvider | resolved explicit light/dark choice; Preferences | stores choice through Preferences; applies web theme data attribute |
| ReminderProvider | reminders, necessities, departure context/session; Auth | reminder-store, scoped departure session; deterministic packs/weather; owns create/check/edit/delete |
| TripProvider | trips, packing, templates, intentions; Auth + necessities | trip-store, deterministic packing assistant, geocoding/weather; owns travel status and packing |
| PlaceProvider | saved places/Home; Auth | place-store; Home and named-place mutations |
| LittleGuyProvider | transient chat, mood, constellation, suggestions, busy state; reminder/trip/place/preferences | local parser/optional remote AI; tools execute against those providers; chat not durably stored and not reset on account change |
| ContextIntelligenceProvider | notification log refs, foreground watch, route response refs; domain/preferences/auth | due scheduling, proximity, background geofence sync, Wi-Fi hint, notification response routing |
| PushNotificationProvider | enabled-transition ref; Auth + Preferences | OS permission and push token registration; no installation-scoped identity |

Little Guy does not own copies of reminders/trips. `ChatSession` stores conversational messages/tool results for the lifetime of its mounted provider; this presentation history still requires account isolation. `buildConstellation` and mood/whisper derive signals from domain records. Necessity checks are day/session scoped; packing checks belong to a specific trip.

## Route map

All screen files under `src/app` are listed below. Route-group notation disambiguates tabs; the main index is the Home screen. Auth/onboarding guard logic can override navigation. This is a static incoming-link inventory, not a device reachability certification.

| Source route | Purpose and ordinary entry |
| --- | --- |
| `opening/index.tsx` → `/opening` | signed-out paper-unfold/login choice; guard cold start |
| `auth/create-account.tsx` | opening/sign-in → email/password/confirmation and legal agreement |
| `auth/sign-in.tsx` | opening/create-account → login |
| `onboarding/index.tsx` | redirects to name |
| `onboarding/name.tsx` | guard after auth until setup complete; name → interests |
| `onboarding/getting-to-know-you.tsx` | interests/skip; completes onboarding → tabs |
| `onboarding/preferences.tsx` | legacy toggle screen; no incoming link from current onboarding; links to complete |
| `onboarding/complete.tsx` | legacy finish screen; incoming only from preferences; completes → Home |
| `(tabs)/index.tsx` | Home board; guard or Home tab; Before U Go and Little Guy entry |
| `(tabs)/on-the-way-back.tsx` | Way Back tab; renders shared OnTheWayBackDesk |
| `(tabs)/add.tsx` | Add tab and list capture links; local classification and hold-to-talk |
| `(tabs)/trips.tsx` | Trips tab; upcoming/past, new trip, templates, Little Guy |
| `(tabs)/profile.tsx` | Profile tab; name/interests, necessity weekdays, settings, Home GPS, account/legal actions |
| `before-ugo/index.tsx` | Home/notification → necessities, departure context, extras and departing packing |
| `on-the-way-back/index.tsx` | legacy/notification route → Way Back tab redirect |
| `reminders.tsx` | legacy/notification route → Home redirect |
| `little-guy/index.tsx` | Home/Trips mascot → chat, suggestions, voice input |
| `trip/index.tsx` | `/trip` → Trips tab redirect |
| `trip/new.tsx` | Trips create action or template use → trip form |
| `trip/[id]/index.tsx` | trip card → detail, packing/travel, plans, template save, archive/delete |
| `trip/[id]/edit.tsx` | trip detail edit → form |
| `trip/[id]/packing.tsx` | trip detail → checklist, edit/add/dismiss/regenerate/apply template |
| `trip/[id]/travel-mode.tsx` | trip detail → native map + intention add/edit/remove |
| `trip/templates/index.tsx` | Trips → list/create saved packing templates |
| `trip/templates/[id].tsx` | template row → detail/edit/remove/use |
| `legal/[document].tsx` | sign-in/create-account/Profile → `privacy`, `terms`, `cookies`, `refunds`; invalid document redirects to sign-in |

Layouts: root `_layout.tsx`; `(tabs)/_layout.tsx` (Home/Way Back/Add/Trips/Profile); stack layouts in `auth`, `onboarding`, `opening`, `before-ugo`, `on-the-way-back`, `trip`, `trip/[id]`, `trip/templates`. Headers are custom scrapbook components; most details offer Back, not persistent Home/Help.

`useSessionGuard` waits for auth/preferences. Signed-in/onboarded users go to tabs from opening/auth/onboarding; incomplete setup goes to onboarding/name; signed-out/new process goes to opening unless on legal. `opening-session.ts` is in memory and is cleared on logout. No persistent first-install marker, Skip control, shortened variant, or pending notification destination exists. There is no app-state listener that deliberately replays opening on resume.

## Local persistence

`storage/preferences-storage.ts` delegates to `secure-storage.ts`: native Expo SecureStore (Keychain/Keystore-encrypted storage), memory Map on web. Domain keys use `blugo.<collection>.<userId>`. Whole arrays/objects are serialized per key; no local SQL database/outbox is installed. Keychain accessibility is `AFTER_FIRST_UNLOCK`, not a promise that reads are blocked whenever the display is locked.

Scoped records: profile, preferences, reminders, necessities, context, trips, packingItems, packingTemplates, travelIntentions, savedPlaces, notificationLog, departureSession, departureTriggerCooldown, widgetBoard. Unscoped records include `blugo.geofenceManifest`, legacy `blugo.device.snapshot`, `blugo.migrated.<userId>` markers, and `group.com.b4ugo.app.departureBoard` widget serialization. Session storage is separately chunked in `supabase/client.ts`; domain collections are not.

`engines/reminder-store.ts`, `trips/trip-store.ts`, and `places/place-store.ts` read local snapshots, then prefer remote reads when configured. They write local first, then attempt remote writes. Providers often change memory first and suppress storage exceptions. There is no persisted pending-sync state or automatic reconnect drain. Thus this is a cache-based offline fallback, not completed durable local-first synchronization.

Widget data is a JSON payload written through the same storage abstraction. An App Group-named key does not establish an App Group container or native widget extension. No widget target/configuration was found in tracked source.

## Repositories and server synchronization

All current repositories are mapped here; UI uses providers rather than issuing SQL directly.

| File (`src/lib/api/`) | Methods / records |
| --- | --- |
| `profile-repository.ts` | get/upsertProfile → `profiles`; get/upsertPreferences → `user_preferences` |
| `reminder-repository.ts` | list/replaceReminders, list/replaceNecessities, get/saveActiveDeparture → `reminders`, `personal_necessities`, departure `trip_contexts`; creates context stubs for reminder references |
| `trip-repository.ts` | list/replaceTrips, list/replacePackingItems, list/replaceTemplates, list/replaceIntentions → trip `trip_contexts`, `trip_items`, `packing_templates`, trip-linked `saved_places_or_intentions` |
| `place-repository.ts` | listPlaces, upsertPlace, deletePlace → non-trip `saved_places_or_intentions`, including Home |
| `push-token-repository.ts` | upsertToken, removeAllForCurrentUser → `push_tokens` |
| `migration.ts` | ensureMigrated, writeDeviceSnapshot; one-time local upload marker and legacy snapshot fallback; not a retry queue |
| `http.ts` | timeout-limited public JSON fetch; returns null on errors; used by weather/geocoding |
| `index.ts` | re-exports migration/profile/reminder/trip repositories; no additional persistence |

`getSupabase()` is a singleton client using publishable configuration and session-storage adapter; `requireSessionUserId()` calls `auth.getUser()`. Most repository errors are warnings/null rather than typed errors. Replace operations delete missing IDs and upsert arrays. Place-store performs a similar per-user scan/delete loop. There is no revision-based merge/realtime subscriber/outbox. Server reads can overwrite unsynced local data.

SQL migrations:

- `0001_init.sql`: profiles/preferences; necessities; `trip_contexts` with departure/trip kinds; reminders; packing `trip_items`; saved places/intentions; packing templates. Auth-user cascade FKs, per-owner RLS, updated-at triggers, new-user profile/preferences trigger.
- `0002_push_tokens.sql`: per-user/token rows and `push_delivery_log` (unique reminder/due time). Users can read own delivery log; service-role sender inserts.

Schema gaps: necessity weekdays, quiet hours, installation IDs, sync revisions/tombstones, receipt/attempt state and parent-child owner consistency. No Phase 0 database/config migration was added or applied. Hosted schema, RLS, cron, credentials, and deployed functions were not queried.

## Notification pipeline

| Path | Trigger → implementation → output |
| --- | --- |
| Local due | reminder/provider changes → ContextIntelligence → `planDueReminderActions` → ExpoNotificationService → `due:<id>:<dueAt>` schedules/cancels |
| Foreground context | location watcher → proximity/evaluateReminders → `remindersToNotify`, local dedupe log → immediate notification |
| Foreground shop | built place anchors + enteredPlace → grouped shop copy → `shop:` notification + cooldown log |
| Wi-Fi departure hint | NetInfo transition Wi-Fi → cellular/offline, 07:00–11:00, three-hour cooldown → immediate Before U Go hint; no Home SSID verification |
| Background geofence | OS entry task → global manifest → direct Expo notification `geo:`; bypasses service/dedupe/quiet-hour policy |
| Remote due | cron must invoke `due-reminder-push` → service-role reminders/preferences/tokens → delivery-log insert → Expo push send (no tickets/receipts processed) |
| Registration | PushNotificationProvider → permissions/project ID/device checks → Expo token → push token repository |
| Response routing | ContextIntelligence consumes last notification + response listener → `hrefFromNotificationData` allowlist → router.push; auth guard runs independently |

`notification-service.ts` configures foreground display and an Android channel, requests permission, schedules/cancels/lists alerts, often swallowing errors. Remote and local delivery have no shared dedupe. Quiet-hours fields are unused. The scheduled sender queries ±90 seconds and logs before sending; accepted delivery is not confirmed.

`signOutWithCleanup` awaits push removal and geofence cleanup before auth invalidation, tolerating rejection so logout can proceed. Removal is currently account-wide, cleanup lacks a deadline, and due schedules are not cancelled. The geofence manifest is cleared before native stop, but in-flight task/sync callbacks have no owner-generation guard. See R09–R16 rather than treating cleanup ordering as complete account isolation.

## Location/geofence and public API pipeline

`device-location.ts` handles foreground/background permissions, service availability, balanced/high-accuracy fixes and foreground watches. `use-device-location` feeds LiveMap. Profile sets Home from GPS/reverse geocoding; autocomplete can prefer nearby origin. Reminder and trip providers use `geocodingService`; `nearby-search`, Nominatim and Open-Meteo resolve places; Open-Meteo supplies live weather when coordinates exist.

`buildPlaceAnchors` groups open located errands/saved places into shop regions. `syncGeofenceRegions` writes the manifest and starts/stops `blugo-geofence`; task is defined at module scope in `geofence-task.ts`. Current registered-task precondition may prevent first native registration; selection does not enforce platform region caps. Foreground `proximityTracker` separately detects leaving Home and entering/leaving places/trips. No continuous background home-departure task is configured.

Compatibility exports in `engines/location-services.ts` now delegate to live services despite `Local*` names. `weather-service.ts` exports the live adapter. `suggestion-engine`, `packing-assistant`, and `context/routines` remain deterministic. `recommendation-engine` and `intention-matcher` return empty results; Travel Mode map display does not establish those recommendation services.

Coordinates/search queries can be sent to weather/geocoding services; Home is stored locally and in saved-place server rows when synchronization is configured. Exact background behavior depends on permission, OS process state, region limits and build configuration ([SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)).

## Little Guy tool flow

```text
typed or edited spoken message → LittleGuyProvider.send → runChatTurn
  opt-in off: FallbackAIProvider / interpretLocally
  opt-in on: ResilientAIProvider → RemoteLLMProvider → HTTP proxy or Supabase little-guy → Gemini
                              ↘ local fallback on unavailable/error
  tool calls → protectNecessitiesFromPacking + validateToolCall
             → provider executor → Reminder / Trip / Place commands
             → tool-result contract → verified reply formatter → visible ChatSession
```

At round zero, a remote text-only answer can be replaced with local action parsing. With cloud enabled, this is still remote-first. `chat-service` bounds rounds; it does not cap history or implement request-specific context. Intermediate assistant tool-call messages are hidden; follow-up tool results are scoped to the current turn to avoid the previous “saved meow” replay.

Tool catalogue (executor in LittleGuyProvider, schema/validation in `tool-schemas.ts`/`ai-tools.ts`):

- Reminder: createReminder, updateReminder, completeReminder, completeAllReminders, deleteReminder.
- Places: createSavedPlace, updateSavedPlace, deleteSavedPlace.
- Trips: createTrip, updateTrip, deleteTrip, getTrip, getUpcomingTrips.
- Packing: getPackingList, addPackingItem, removePackingItem, togglePackingItem, toggleAllPackingItems, suggestPacking.
- Other: getPersonalNecessities, addPersonalNecessity, addIntention, updateIntention, deleteIntention, getTodayContext, getUpcomingContext, getWeather.

Creation results use `{success: true, displayName}`; mutation formatting suppresses unverified model success text. However fulfilled store methods can hide local/remote failures or no-ops. Delete confirmation is an argument, not an app-owned user approval. ID resolvers use first-match heuristics, and some trip paths default to the first trip. No departure-start, diagnostics, or spoken-list tool exists.

`buildAIContext` creates a bounded-count snapshot without home places or structured coordinates. It includes other reminders/trips/packing/places/intentions, regardless of request relevance. Remote requests send snapshot + formatted RAG + all tools + full chat/tool history. No precise coordinate fields or credential fields are deliberately inserted, but unredacted free text and prior-account history remain risks.

Three Gemini conversion paths exist: `lib/ai/gemini.ts` (2.5 default constants and tests), the Edge Function and local development proxy (3.5 default, override by `GEMINI_MODEL`). The actual RemoteLLMProvider calls the proxy/function; client conversion tests do not prove proxy parity. Supabase sends the auth header to its function, which forwards the user content to Gemini with a server-only key. No model executes database writes.

## Voice pipeline

`Add` and `little-guy` → `useHoldToSpeak` → optional native `ExpoSpeechRecognition` probe → permission request → native start with `en-US`, interim results and punctuation → transcript callback → editable screen text. Release calls stop and immediately removes event listeners. Missing module falls back to typing; it does not implement browser speech recognition or cloud transcription.

Current visible states: listening and error text, plus screen busy/saved state. Partial/final distinction is discarded by the hook. No tap control, explicit Stop, permission/processing/review state machine, offline recognition selection, haptic/audible feedback, read-aloud or interpretation confirmation exists. Final-result timing and permission/release races need native tests. Add classifies locally and saves through ReminderProvider; chat goes through the tool loop. Chat clears the draft before the send result is known.

## Security and privacy boundaries

- Credentials/session: Supabase Auth; native SecureStore session chunks, memory on web. Development placeholder performs no real identity validation and is unavailable as a release auth fallback. Auth provider selection must explicitly be `supabase` with usable URL/key.
- Data ownership: per-user local keys and RLS exist; this does not solve shared manifest/chat/widget state, migration races, parent ownership, or stale async work. Account deletion is an authenticated Edge Function and server cascades; full local-key erasure is incomplete.
- Secrets: `EXPO_PUBLIC_*` is public. Gemini/service-role keys belong only to server processes. `.env` files are ignored; the app never needs a Gemini secret.
- Optional AI: opt-in false by default. The current opt-in sends broad bounded record context and unbounded message history; more minimization is needed. The AI Edge Function checks header presence, with gateway identity enforcement dependent on deployed configuration. No explicit per-user rate limit/body/history budget was found.
- Public APIs: weather and place requests can contain coordinates and queries; `fetchJson` logs URLs on failure. Audit production logging for sensitive data. Native speech service behavior may involve OS cloud processing; invoking a native API does not prove offline/on-device recognition.
- No analytics, advertising, session replay, third-party content embeds or payments were found. Legal documents and account agreement exist; processor retention, transfer rules, store disclosures and operator details require external review.

See [SECURITY.md](SECURITY.md), [TESTING.md](TESTING.md), and the open risk register before treating any of these boundaries as release-certified.
