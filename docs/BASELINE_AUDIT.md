# Phase 0 baseline audit

Audited 2026-10-29 against the master B4UGO specification. Starting commit: `176799b`; branch `main`; initial `git status --short` and diff were empty. All pre-existing files, including earlier fixes, were inspected as current implementation. Phase 0 changes documentation only.

Method: read AGENTS, README, package/lock/config, docs, route/provider/repository/pipeline source, SQL migrations, Edge Functions, and existing tests; run the existing checks; calculate representative source-color contrast. No native UI session, assistive-technology session, database mutation, deployment, live Gemini request, or push delivery was performed. “Confirmed” below means source-confirmed unless runtime evidence is stated. Possible races and platform effects are labeled risks and require integration/device reproduction.

References read: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [SDK 57 Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/). Platform support and background delivery depend on OS state; no “always delivers when closed” guarantee is justified by app configuration.

## Specification coverage

| Requirement | Baseline | Evidence / gap |
| --- | --- | --- |
| Three everyday journeys | Present, with capture mismatch | Home/Before U Go, Way Back, trips exist; Add's Trip chip writes departure reminders rather than a selected travel packing list (R22) |
| Shared state for Little Guy | Present at domain level | Tool executor calls the same providers; session chat remains separate presentation history, with account-isolation gap (R16) |
| Scrapbook identity / Fraunces / constellation | Present | Tokens, font asset, paper primitives and vector mascot; essential text still rotates inside paper and chat uses decorative type (R25) |
| Opening lifecycle, Skip, notification bypass | Partial | Signed-in restore skips opening; in-memory session flag only; no Skip or queued notification target (R24) |
| Local-first, durable offline records | Partial / unreliable | Native SecureStore cache; web memory; swallowed failures; remote reads can overwrite offline edits (R01–R05) |
| Record sync, retry, conflicts | Absent | Whole-collection replacements; no outbox/revisions/tombstones/retry UI (R01, R03) |
| Per-device push, receipts, quiet hours | Incomplete | Tokens registered but account-wide removal; log before delivery; no receipts/quiet-hours enforcement (R09–R13) |
| Deterministic-first AI / optional Gemini | Partial | Local parser and explicit opt-in exist, but opted-in requests call remote first (R17) |
| Small relevant context / privacy | Partial | Count caps, no structured home coordinates; unrelated records and unbounded chat/tool history still sent (R16, R18) |
| Validated tools / persisted outcomes / confirmation | Partial | Validation and success display names exist; persistence failures hidden; model controls confirm flag; fuzzy selection (R02, R19, R20) |
| Voice as first-class input | Partial | Hold-to-talk, partial transcript and editing; missing state machine/tap/preview/final-result safety (R21) |
| Calm Mode / guided help / spoken lists | Absent | Five tabs; empty chat prompt; no Calm preference, persistent Help, or TTS command |
| Accessible text, controls and motion | Partial | Many roles/labels and motion hooks; shared text cap, small controls, hidden gestures, contrast failures (R25–R27) |
| Visible operational states / retained input | Incomplete | Some busy/empty/auth error UI; most persistence/delivery failures console-only; chat clears draft before send (R02, R21, R23) |
| Safety/privacy boundaries | Partial | No analytics/embeds/payments found; legal warning exists; no medical-advice guard in system prompt, runtime safety untested (R28) |

## Risk register

Priority: P0 = data loss, account/privacy, or delivery correctness before release; P1 = core usability/reliability gap; P2 = quality/maintainability/release evidence. This is prioritization, not a claim of a tested exploit. All findings below remain open; none was implemented in Phase 0.

| ID | Priority | Finding, source evidence, and consequence | Follow-up phase |
| --- | --- | --- | --- |
| R01 | P0 | `api/reminder-repository.ts` (`replaceCollection`), `api/trip-repository.ts` (`replaceUserRows`, `replaceTrips`, `replaceIntentions`), `places/place-store.ts` compare remote IDs to a local array, delete missing IDs, then upsert. A stale device can remove another device's records; operations are not transactional and parent deletion cascades packing/intentions. | 1–2 |
| R02 | P0 | `ReminderProvider`, `TripProvider`, and `PlaceProvider` update React state before storage and swallow write errors. Repository errors also often resolve after console warnings. `LittleGuyProvider` converts fulfilled calls into `success: true`; a named result does not prove disk persistence. Add/trip forms can clear or navigate away after an in-memory-only save. Existing executor-mock tests cannot prove durable success. | 1, 4 |
| R03 | P0 | `engines/reminder-store.ts`, `trips/trip-store.ts`, `places/place-store.ts`, and Preferences load remote data over the local cache; an older/empty remote collection can overwrite offline edits. No durable outbox, reconnect retry, revision comparison, tombstones, or conflict UX exists. `loadContext` retains local context when remote returns null, conflating deletion/absence/failure. | 2 |
| R04 | P0 | `api/migration.ts` has one process-global in-flight promise, not keyed by account. Unscoped `blugo.device.snapshot` fallback accepts missing email as a match. Migration marks complete after repository calls that can suppress failures; remote-data detection checks only three collections. Risk of skipped uploads, wrong-account fallback, and cross-account migration races; no live reproduction performed. | 1–2 |
| R05 | P1 | `storage/secure-storage.ts` stores whole JSON collections per key; only Supabase session storage is chunked. No transactional/size-tested domain store. Read failures/corruption become empty data; removes swallow errors. Web is explicitly memory-only and loses all records/session on reload. `AFTER_FIRST_UNLOCK` must not be described as unreadable whenever the screen is locked. | 1 |
| R06 | P1 | `PersonalNecessity.activeDays` is local only: absent from SQL and repository mapping. `profile-repository.toPreferences` reconstructs defaults for quiet-hours/analytics fields; those fields do not round-trip to SQL. Weekday choices cannot follow a second device. | 2 |
| R07 | P0 | SQL owner RLS exists, but `trip_items.trip_id`, `reminders.context_id`, and intention `trip_id` reference a parent ID without a composite owner constraint or parent-ownership policy check. A child can name an unrelated owner's parent if its ID is known; validate and tighten this in isolated RLS tests. No tested data-disclosure exploit is asserted. | 2 |
| R08 | P1 | `saveActiveDeparture` deactivates every departure then upserts without a transaction/one-active constraint. Full collection saves and migration calls can overlap. SQL has no sync operation IDs, tombstones, version preconditions, or per-record conflict policy. `set_updated_at` does not itself prevent lost updates. | 2 |
| R09 | P0 | `push-token-repository.removeAllForCurrentUser` deletes all tokens for a user. Logout or disabling notifications on device A unregisters B too. Schema uniqueness is `(user_id, expo_push_token)` with no installation ID or exclusive reassignment policy; same token may remain linked to multiple users after failed cleanup. | 3 |
| R10 | P0 | `due-reminder-push` inserts a delivery log before `sendExpoPush`; HTTP failures only log, HTTP-200 Expo ticket errors are ignored, and no receipts/invalid-token removal exist. Dedupe is reminder/due-time, not device attempt. Concurrent invocations can both send despite a unique insert failure. The ±90-second window can send early or miss outages. | 3 |
| R11 | P0 | `ContextIntelligenceProvider` schedules local due alerts while the server can send the same reminder remotely; no shared delivery coordination. Logout cleanup cancels only `geo:` IDs, leaving scheduled `due:` alerts from the outgoing account. Signed-out due-sync effect returns without cancelling them. | 3 |
| R12 | P0 | `due-reminder-push` uses service-role data access without checking the caller's scheduler privilege inside the handler. Actual gateway JWT policy/deployment was not tested; do not assume a gateway accepting ordinary authenticated JWTs restricts invocation to cron. Add explicit scheduler authorization and negative tests. | 3, 8 |
| R13 | P1 | Quiet-hours fields exist in types but no current settings editor or enforcement was found in local scheduling, foreground notifications, background task, or server sender; SQL does not store them. Never expose/advertise working quiet hours until end-to-end enforcement exists. | 3 |
| R14 | P0 | `geofence-sync.ts` requires `TaskManager.isTaskRegisteredAsync` before calling `startGeofencingAsync`; top-level `defineTask` is a definition, not proof of native registration. Clean-install registration may be skipped. No region-limit selection or visible failure state. Fresh-install behavior needs device reproduction. | 3 |
| R15 | P0 | Manifest is device-global and lacks owner/session generation. Logout clears it first, but an already-running task can have loaded old content; concurrent sync/foreground callbacks can recreate or send outgoing-account work. Cancellation flags do not fence all asynchronous stages. Notification APIs and SecureStore remove hide failures. Needs race tests, not a guarantee from ordering alone. | 3 |
| R16 | P0 | `LittleGuyProvider` stays mounted above routes and has no auth-dependent chat/session/suggestion reset. Prior-account chat can remain visible and enter a subsequent cloud request. Push registration and Wi-Fi listener setup also lack complete async cancellation/account fencing; AuthProvider does not subscribe to Supabase auth-state changes. | 3–4 |
| R17 | P1 | With opt-in enabled, `ResilientAIProvider` calls remote before fallback. `runChatTurn` tries local actions only after a text-only reply or fallback. Common commands can incur latency/quota; HTTP has an 18s deadline, Supabase invoke and server Gemini fetch have no explicit app-level deadline. No visible local/cloud/offline diagnostic. | 4 |
| R18 | P0 | `buildAIContext` excludes home places and coordinate fields and caps record counts, but is not request-specific. Remote payload includes all session messages/tool results, structured context, formatted context, and all tools. History grows unbounded. Free-text users can include sensitive data; no request-specific redaction/filtering/budget is enforced. | 4 |
| R19 | P0 | Delete validation trusts tool `confirm` (model/prompt/local parser can set `yes`). Bulk complete/packing operations run immediately. No app-owned pending action/confirmation step binds the user to a proposed record list. Some UI deletes and Clear checked execute immediately; only trip/account deletion have explicit confirmation surfaces. | 4, 6 |
| R20 | P1 | Entity resolvers choose the first fuzzy match and return unknown explicit IDs unchanged; executor `tripByHint` falls back to the first trip. `completeReminder` toggles a record, which can reopen a completed item. Tool catalogue lacks departure-start, diagnostics/help and read-aloud actions. Incomplete generic follow-ups and unsupported claims need acceptance tests. | 4 |
| R21 | P1 | Shared voice wrapper supports hold only and fixed `en-US`, not explicit tap/Stop or on-device-only recognition selection. `stop()` removes listeners immediately, risking loss of final results. Async first permission request may finish after release. No end/processing state, speech-specific offline fallback state, haptics, audible feedback or TTS. Chat clears its draft before `send`; no durable failed transcript/retry draft. | 5 |
| R22 | P1 | Add's Trip choice depends on `ReminderProvider.context` and calls `addThisTrip`, not `TripProvider.addPackingItem`; no selected travel-trip preview. Local classifier extracts a reminder title but does not pass `dueAt` to Add's save path. A command like “tomorrow” can lose its scheduling semantics. Some forms preserve input on thrown errors but offer no error feedback; swallowed errors bypass that protection. | 1–2, 4–5 |
| R23 | P1 | Most notification/location/sync errors are console-only or normalized to unavailable/empty; preferences can say On after permission denial. No diagnostics screen or pending/failed-sync state. The current public config has no EAS project UUID. Requesting notification permission can happen on sign-in with default enabled, before onboarding explains it. | 3, 8 |
| R24 | P1 | Opening full sequence exists (login at 3380ms); signed-in restore bypasses it and background return has no explicit replay trigger. Signed-out cold starts use a process flag, no persistent first-launch/short variant and no Skip. Reduce Motion starts as false pending async read. Notification response handling and session guard race independently; no queued target survives sign-in/onboarding. | 6 |
| R25 | P1 | `ui/Text.tsx` caps shared AppText scaling at 1.4; raw Text elsewhere is not globally capped, so behavior is inconsistent. PaperPanel rotates entire content; ButterButton rotates its label; many essential labels use `numberOfLines`. Fraunces chat/whisper confirmations can contain essential names/dates. Fixed calendar/button/tab layouts need maximum-text testing. | 6 |
| R26 | P1 | `minTouchTarget=44` on all platforms; map recenter is 36×36, calendar day cells height 38, weekday chips minWidth 30. Day cells lack full date labels; repeated one-letter weekday labels are ambiguous. Some fields rely only on placeholders. Chat/voice status lacks reliable announcements; hidden swipe actions lack a visible non-gesture alternative on several lists. Keyboard/modal/switch-control behavior not exercised. | 5–6 |
| R27 | P1 | Selected Add chips use cream on sage (2.51:1) and swipe delete uses cream on coral (2.74:1): fail normal-text 4.5:1. Dark Add selected label uses cream on matcha (~2.51:1); source token pairing dark ink/matcha is also only 2.15:1. Base paper text and deep-forest buttons pass representative calculations; earlier general contrast claims do not cover all controls. | 6 |
| R28 | P1 | Legal content and explicit AI opt-in exist; release operator/market/legal review, public deletion URL and backend deletion remain unverified. Profile deletion copy claims all device data, but resetAll omits departure session/cooldown/widget/global snapshot/migration keys and chat. System prompt lacks an explicit medical-advice prohibition; no runtime safety evals. Gateway auth/rate limits/body-size controls and processor settings require service checks. | 3–4, 8 |
| R29 | P1 | No Calm Mode preference, simplified navigation, persistent Help, guided initial Little Guy choices or spoken instructions. Current Profile/trip screens expose many choices; “tell him” and “continue” depend on surrounding context. Standard layout must remain when adding Calm Mode. | 7 |
| R30 | P2 | No native E2E runner/flows or provider/database integration suite found. TypeScript excludes tests/Edge Functions; `expo lint` does not establish Edge Function correctness. Existing 39 suites largely test pure logic/mock providers. Widget export is SecureStore serialization, not a native App Group extension; model defaults differ between client adapter and server/proxy. No tracked EAS build profiles. | 8 |

## Settings and route reachability

All route files and layouts are mapped in [ARCHITECTURE.md](ARCHITECTURE.md#route-map). “Reachable” means an incoming code link exists, not that navigation was device-tested.

| Setting or screen | Current reality |
| --- | --- |
| Push notifications | Visible Profile toggle requests permission and stores intent; can stay On when denied; no effective-permission/token status |
| Context-aware / Routines | Visible flags feed local evaluation; no routine CRUD/schedule editor; generated routines are deterministic rules |
| Location reminders / Home | Visible; requests foreground/background and notification permissions; Home uses current GPS; failures may return silently |
| Cloud AI parsing | Visible explicit opt-in, defaults false; Profile lacks the detailed transfer explanation present on the legacy onboarding preferences screen |
| Dark mode / Reduce motion | Dark/light saved; Reduce Motion is OS readout only; no system appearance mode |
| Quiet hours / Analytics | Stored type fields, absent from current Profile controls; quiet hours not enforced; no analytics SDK found |
| Weekday necessities | Visible chips; device-local activeDays, not synced; no dedicated tests found |
| Onboarding preferences / complete | Files exist, preferences links to complete, but current name → getting-to-know-you → tabs flow bypasses both; manual deep links remain possible |
| Legacy `/reminders`, `/trip`, `/on-the-way-back` | Intentional redirect routes, not dead screens |
| Saved-place management / Help / Diagnostics / Calm | No dedicated routes; places are managed through Profile Home, Add place lookup, or Little Guy |
| Packing/template composers | Additional capture paths still exist; historical “Add is the only capture” claim applies only to the removed departure/errand inline composers |

## Accessibility evidence

Source-confirmed strengths: checkbox roles/state on checklist rows; explicit tab and back labels; form labels/password-manager metadata and visible field focus; legal consent is separate/unchecked; Little Guy has a meaningful image label; SlipNote uses an alert/live region; reduced-motion hooks exist for several animations; textual lists/counts accompany constellation decoration.

Unverified: VoiceOver/TalkBack reading order, date modal focus, hardware keyboard, Switch Control/Access, text at largest sizes, clipping, sufficient effective hit area, complete theme contrast, and fatigue/cognitive load. No screenshot or device proof was produced in this phase. The source violations in R25–R27 prevent claiming compliance.

Representative sRGB luminance calculations (actual source hex values, opaque backgrounds, normal-size text):

| Pair | Ratio | Result |
| --- | --- | --- |
| Espresso `#2C221E` / cream `#FCFAF7` | 14.88:1 | Pass |
| Secondary `#6E655F` / cream | 5.46:1 | Pass |
| Cream / deep forest `#4F6B4E` | 5.69:1 | Pass |
| Cream / sage `#8AA889` (Add selected / light weekday chips) | 2.51:1 | Fail |
| Cream / coral `#D9826B` (delete) | 2.74:1 | Fail |
| Dark primary `#ECEAE4` / paper `#1B211E` | 13.61:1 | Pass |
| Dark secondary `#9DA8A1` / paper | 6.66:1 | Pass |

Ratios do not cover translucency, pressed/disabled states, focus rings, non-text contrast, or rendered output. Use the [accessibility matrix](TESTING.md#accessibility-test-matrix) before closing these findings.

## Documentation reconciliation

| Document | Contradiction found | Phase 0 action |
| --- | --- | --- |
| README | Expo starter, reset instructions, no product/setup reality | Replaced with actual B4UGO setup and limitations |
| ARCHITECTURE / DATA_MODEL / lib+store READMEs | In-memory-only, two providers, absent auth/backend/AI, old types | Replaced with present inventory and explicit gaps |
| DEVELOPMENT | Node 18 minimum, Expo Go as full device path, outdated onboarding | Corrected SDK 57 minimum, native build and command behavior |
| SECURITY / AUTH | No coordinates, password transmission, backend or permissions; provider unconnected; future RLS | Reconciled to current source boundaries and unverified deployment |
| MEMORY / TRIPS / BEFORE_UGO / HOME | Weather/location stubs, fake navigation, old capture and Home mascot claims | Reconciled to live adapters and current journeys |
| DESIGN_SYSTEM / OPENING_LOGIN | Old hex values/font, dynamic-type cap framed as compliance, incorrect logout/replay claim | Corrected baseline versus required future behavior |
| BACKEND / supabase README | Only first SQL migration, 2.5 default, automatic AI call without consent caveat, broad sync assurance | Both migrations, actual proxy defaults and external setup/limitations documented |
| CHANGELOG / REFACTOR_LOG | Historical phases and “offline sync” can imply current reliability | Preserve history, add current correction/status notice |
| COMPLIANCE_AUDIT | Earlier point-in-time claims could imply full accessibility/deletion certainty | Add current engineering qualification with references; no new legal certification |

## Baseline conclusion

The existing application has working domain logic and passing local checks. Durable persistence, multi-device sync, account-safe delivery, voice state coverage, and accessibility remain implementation work. [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) orders that work with measurable gates. Phase 0 fixes no runtime finding.
