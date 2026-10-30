# B4UGO testing and release evidence

## Phase 1 local checkpoint — 2026-10-30

Phase 1 is partial: automated local checks pass; hosted/native/end-to-end acceptance remains open. Use revised phase numbers in IMPROVEMENT_PLAN; original I01–I15 identifiers below retain historical numbering.

| Check | Observed result |
| --- | --- |
| `npx tsc --noEmit` | Exit 0, no diagnostics |
| `npm test -- --runInBand` | 45 suites / 208 tests passed; 0 snapshots |
| `npm run lint` | Exit 0, no warnings/errors |
| `npm run test:database` | 20 assertions passed in isolated PostgreSQL/PGlite |
| `npm run test:push` | 10 injected Edge-handler scenarios passed |
| `git diff --check` | Exit 0, no diagnostics |
| `npx expo install --check` | Approved online run: dependencies up to date, exit 0 |
| `npx expo config --type public --json` | Exit 0; SDK 57; SQLite/location/notification/speech plugins; EAS UUID missing |
| Web production export | Exit 0; 34 routes including diagnostics; `/tmp/b4ugo-phase1-final-web.AdatHz` |

New repository tests cover atomic record/outbox failure, offline restart/retry, corrupt data retention, 1,500-record import, two-device reconnect in both orders, stale edits/conflicts, lost responses/idempotency, account fencing, multi-collection rollback and device-check separation. Mounted ReminderProvider tests execute real commands/repository logic with fault-injected storage: persisted entity, duplicate/no-change, restart, failed-commit UI state and account switch.

Native adapter tests execute production migration logic through an Expo-shaped adapter backed by Node's actual SQLite engine: interruption rolls back data/marker, retry/repeated import succeeds without duplicates, accounts remain separate, 5,000 items survive module restart, and erasure preserves the other account. They do not exercise the Expo native bridge or physical process death.

`test:database` executes migrations 0001–0004 with synthetic Supabase auth roles, verifying backfill, operation receipts, revisions, RLS, parent-owner checks, trip-child tombstones and anonymous denial. The harness omits only the existing `pgcrypto` extension declaration because core Postgres supplies `gen_random_uuid`. Hosted gateway/cron behavior remains unverified.

`test:push` transpiles and executes the actual Edge handler with injected database/Expo endpoints: scheduler auth, individual tickets, no duplicate resend, invalid tokens, lost response → uncertain, HTTP rejection/backoff, local-route exclusion, no early send, overlap and receipts. SQL claiming is checked separately by PostgreSQL tests. These do not replace Deno type/deploy checks or live APNs/FCM receipts.

### Remaining Phase 1 acceptance

1. Select an isolated Supabase fixture project; back up and apply 0003/0004; test two real authenticated clients, reconnect/edit/delete/conflicts, owner negatives and installation logout/token rotation. Stop the old cron and retire old binaries at cutover because 0003 revokes legacy writes. No hosted migration was performed.
2. Deno-check/deploy the sender; set `PUSH_SCHEDULER_SECRET` (32+ characters), schedule once-per-minute POST with `x-cron-secret` plus the gateway Authorization token when JWT verification is enabled, and test unauthorized rejection, catch-up and receipts in staging. Both credentials belong only in server-side scheduler configuration. Supply EAS UUID and APNs/FCM credentials before live validation.
3. Rebuild native SDK 57 binaries with SQLite. On iOS/Android, capture clean onboarding/allow/deny/revoke/background explanation; offline save → terminate → relaunch → retry; low space/interruption; account switch/logout while callbacks are pending; geofence first-start/caps/races; two-installation isolation; delivery-mode handoff/interruption; release notification cold/warm launch. An approved simulator query found iOS 26.5 but no booted device; no physical device was tested.
4. On the actual web origin, verify save/reload/offline/reconnect, quota/denial, two-tab Web Locks and account switching. Exporting proves the build, not this interactive flow.
5. Check new preferences/diagnostics/errors with VoiceOver/TalkBack. Remaining global text-cap/hidden-gesture/rotation/Calm Mode work belongs to Phase 5; no assistive-technology result is claimed.

Phase 2 remains gated by these acceptance checks. IMPLEMENTATION_LOG records the exact continuation point and known limits.

## Retained Phase 0 baseline

Phase 0 baseline, 2026-10-29, source commit `176799b`. Passing local checks are not proof of durable writes, accessible UI, deployed RLS, native background behavior, or push delivery. No application/test/dependency/configuration code changed in Phase 0.

## Baseline results — 2026-10-29

Environment: macOS workspace, Node **v24.18.0**, npm **11.16.0**. Existing dependencies were already installed. Initial `git status --short`, `git diff --stat`, and `git diff --numstat` had no output. No files were reset or overwritten from a dirty worktree.

| Command | Exact observed result | Exit |
| --- | --- | --- |
| `npx tsc --noEmit` | No output / no diagnostics | 0 |
| `npm test -- --runInBand` | `Test Suites: 39 passed, 39 total`; `Tests: 180 passed, 180 total`; `Snapshots: 0 total` | 0 |
| `npm run lint` | `expo lint` completed with no lint diagnostics (zero warnings/errors) | 0 |
| `npx expo install --check` (sandbox) | `Networking has been disabled`; local fallback warned `Dependency validation is unreliable in offline-mode`; `Dependencies are up to date` | 0, qualified |
| `npx expo install --check` (network-approved repeat) | `Dependencies are up to date` | 0, online confirmation |
| `npx expo config --type public` | Config resolved successfully; `sdkVersion: '57.0.0'`, iOS/Android IDs `com.b4ugo.reminder`, location background flags true on both, notifications background-remote flag true, microphone/speech plugin present | 0 |
| `git diff --check` (before edits and final documentation review) | No whitespace diagnostics | 0 |

The current public config has `extra.eas.projectId: undefined`; config parsing does not prove a usable remote-push deployment. `app.config.js` replaces location/notifications entries from `app.json`, whose static values alone are misleading. No SDK/package update or `--fix` was needed.

Baseline Jest run reported 1.697s (3.347s process time). Durations are observational, not performance acceptance targets. Final documentation-only edits do not change these runtime results. Final diff scope and documentation checks are recorded in [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md).

## Unit tests

Jest config: `jest.config.js`, `jest-expo`, `**/__tests__/**/*.test.ts`, `@/` mapped to `src/`. No coverage threshold or coverage report is configured. TypeScript excludes `__tests__` and `supabase/functions`; passing `tsc` does not type-check them. Current test inventory:

| Directory | Suites | What is covered |
| --- | --- | --- |
| `src/lib/ai/__tests__` | 12 | tools/argument validation, entity lookup, conversation/local parsing, mocked provider tool loops/results, Gemini adapter conversion, context/RAG formatting, packing, constellation/mood, particles |
| `src/lib/home/__tests__` | 8 | departure board/session, clear checked, departing trips, context status, errands grouping, trip extras |
| `src/lib/notifications/__tests__` | 6 | due-action planning, response route parsing, context filtering/dedupe, Wi-Fi transition/cooldown rules, EAS project-ID resolution |
| `src/lib/location/__tests__` | 3 | coordinates, place anchors, proximity rules |
| `src/lib/trips/__tests__` | 2 | signed dates, past/current/future classification, date/copy formatting |
| `src/lib/geocoding/__tests__` | 2 | place labels and distance labels |
| `src/lib/context/__tests__` | 2 | reminder evaluation and weather injection rules |
| `src/lib/auth/__tests__` | 1 | injected sign-out cleanup ordering, rejection handling and outgoing-account sequence |
| `src/lib/add/__tests__` | 1 | local target/title/place classification |
| `src/lib/reminders/__tests__` | 1 | legacy context-row cleanup |
| `src/lib/geo/__tests__` | 1 | distances/radii |
| `src/lib/launch/__tests__` | 1 | pure launch-target decisions |
| `src/lib/widget/__tests__` | 1 | widget payload serialization |

Inventory total is **41? No: 39 suites**; individual folder counts must reflect the actual files: home has **7**, AI has **11**. The corrected table below is the authoritative count summary: AI 11 + home 7 + notifications 6 + location 3 + trips 2 + geocoding 2 + context 2 + auth/add/reminders/geo/launch/widget 1 each = **39**. Use `rg --files src | rg '/__tests__/.*\.test\.ts$'` to inventory after changes.

Existing tests verify the previous stale-reply/date/mutation-format fixes, but creation executors are mocked; the sign-out helper injects fake cleanup functions. They do not prove storage success, actual token deletion, native geofence stop, notification cancellation, router precedence, or screen behavior. Widget serialization does not prove a native widget exists.

No tests were added or changed in Phase 0 because runtime behavior did not change. Do not weaken existing expectations while adding the missing coverage.

## Integration tests

Current: some in-process collaboration of pure modules (for example chat-service + fallback parser) under Jest; **no provider/native-storage integration suite, real database/RLS tests, Edge Function suite, or mounted route/component suite found**.

Required before the corresponding phase is complete:

| ID / phase | Scenario | Required assertion |
| --- | --- | --- |
| I01 / 1 | Mounted provider + real command + fault-injected persistent store; restart | “Saved” only after durable commit; draft preserved on error; same entity available after reload |
| I02 / 1 | Import large/corrupt/interrupted legacy snapshots | zero unexplained loss/duplication; recovery path; transactional migration marker |
| I03 / 2 | Two account-scoped devices, offline create/edit/delete, reconnect in both orders | no collection replacement; retry idempotent; conflict/tombstone resolution visible; unrelated rows survive |
| I04 / 2 | Disposable Supabase database, two users, child/parent ownership and unauthenticated calls | RLS/constraints deny cross-user access/relationships; no privileged key needed in client |
| I05 / 2 | Migration failure halfway; switch account during async load/write | markers stay incomplete until confirmed; no snapshot/operation leaks into next user |
| I06 / 3 | Sign out A during registration/geofence/native callback; second device remains signed in | outgoing device token only removed; due/geo alerts cancelled; stale callbacks fenced; logout bounded |
| I07 / 3 | Sender with fake Expo tickets/receipts; overlapping cron/HTTP 200 ticket error/HTTP failure/offline intervals | no false sent log; retries/dedupe correct; invalid tokens removed; no early or silent missed reminder |
| I08 / 3 | Quiet hours crossing midnight/DST/timezone and local+remote due alert | single policy and delivery outcome; preference respected; no duplicate local/remote alert |
| I09 / 4 | Local commands with cloud opt-in on; 429/network/timeout remote | common commands make zero remote calls; fallback visible and responsive |
| I10 / 4 | Model injects `confirm: yes`, unknown ID, ambiguous name, repeated complete, duplicate tool round | no unauthorized destructive action; exact list confirmation; complete never reopens; no duplicate save |
| I11 / 4 | HTTP request capture, two accounts, unrelated records, large history | minimal relevant context only; bounded payload; no home coordinates/tokens/prior-account history |
| I12 / 5 | Shared voice hook with native event adapter: permission/release/end/error/final result | all states correct; final transcript retained; stopped after release/cancel; editable preview; no save before confirmation |
| I13 / 6 | Mounted router/auth/preferences/notification listeners and lifecycle changes | first/full/later/skip/motion flows; notification target survives restoration/login/onboarding; no resume replay |
| I14 / 6–7 | Mounted accessible forms/calendars/list actions in standard and Calm layouts | named controls, focus return, stable error/undo, keyboard operability, selected/disabled semantics |
| I15 / 8 | Edge Function method/auth validation, model adapter parity, deletion cascades | rejects unauthorized requests; bounded inputs; same wire contract; all intended records removed |

Database/Edge Function integration should use an isolated local or disposable Supabase project with seeded test accounts, a fake clock, fake Expo endpoint, and test-only records. Phase 0 deliberately made no external writes or live user-data requests.

## End-to-end tests

Current: no Maestro/Detox/Playwright runner, configuration, flow files or native automation were found. No E2E result is claimed. Add tooling only in an explicitly requested implementation phase with SDK 57 compatibility verified.

Minimum future native flows:

1. Fresh launch → full unfold → Skip → account → onboarding → Home; background/resume and later cold launch variants.
2. Add typed/spoken necessity/errand/trip packing; interpretation review; save offline → kill/restart → reconnect. Record IDs and sync states must agree in Little Guy and lists.
3. Check necessities for one departure/day; start another departure; ensure trip packing is separate. Undo/removal/confirmation paths.
4. Create/edit trip, dates, templates, packing and intentions; preserve every draft after injected save failure.
5. Signed-out/onboarding/signed-in notification taps, cold and warm, target missing/deleted, malformed payload, no opening replay.
6. Permission denied/permanently denied/revoked for speech, location, background location, notifications; diagnostics offer recovery.
7. Two devices/account switch/logout while async work is pending; no old chat or alert; another device still receives intended notifications.
8. Cloud off/local-only; cloud on known command; Gemini quota/timeout; ambiguous/bulk/delete confirmations and cancellation.
9. Standard and Calm mode, largest text, keyboard/screen reader, Help/Home and optional spoken lists with Stop.

## Physical-device test matrix

All rows are **not run in Phase 0**. Record device, OS, build type/commit, account fixture, permissions, observed result and evidence before marking pass. Test supported iOS and Android versions including a small phone, a large-text setup, and at least one Android vendor with battery restrictions. OS-supported limits must be described honestly rather than promising delivery after force stop.

| Area | iOS | Android | Dependency / evidence |
| --- | --- | --- | --- |
| Launch | fresh install, later cold launch, app resume, Skip, pre-enabled Reduce Motion | same; notification launch in debug and release | installable binaries and lifecycle recording |
| Auth/cache | restored/offline/expired session; logout; A→B and delete | same; process death/restart | disposable backend accounts; persisted data inspection |
| Notifications | permission allow/deny, local due, APNs remote, foreground/background/terminated tap | Android channel/permission, FCM remote, reboot/process state, release deep link | valid EAS UUID, APNs/FCM/Expo setup; tickets + receipts |
| Multi-device | logout A leaves B registered; disabled push preference scope defined | cross-platform token rotation/reinstall | two actual installations; token row evidence |
| Geofence | clean install first registration, Always/approximate permission, entry/exit/cooldown | background permission/settings, approximate/GPS off, vendor battery rules | walk/drive or controlled location route; native registration inspection |
| Geofence logout race | entry underway then logout/delete; no previous-account alert | same during in-flight native callbacks | native logs scrubbed of content; account generation evidence |
| Home departure | foreground GPS departure and Wi-Fi hint, no false Home-SSID claim | same including rapid Wi-Fi churn | defined expected behavior; no guarantee of background Home departure |
| Voice | first permission press/release, long pause, explicit Stop, final result, Siri/call interruption, Bluetooth | same; recognizer/language pack unavailable; offline/no network | build with speech module; microphone indicator/event traces |
| Speech privacy | verify on-device availability and OS fallback behavior | same | vendor recognizer configuration; explicit opt-in for any cloud fallback |
| Failure recovery | storage failure/low space, airplane mode, backend down, save/restart | same plus process kill | test-only fault hooks and data comparison |
| Travel / map | denied location, no GPS, slow geocoding/weather, trip/date/packing flow | same | location/geocoding services; no destructive live-user tests |
| Deletion | account + cached records/chat/widget/manifest purged as specified | same | deployed delete-account, isolated fixtures, re-auth checks |

[SDK 57 Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) documents Android debug notification-launch splash issues; release-build testing is required. [SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/) documents background/native-build and OS constraints. Expo Go cannot establish full feature correctness.

## Accessibility test matrix

All runtime rows remain **not run**; source findings and sample color calculations are in [BASELINE_AUDIT.md](BASELINE_AUDIT.md#accessibility-evidence).

| Test | Screens / states | Pass criteria |
| --- | --- | --- |
| Dynamic Type / font scaling | every form, checklist, chip, modal, button, tab; small phone + largest accessibility size | no global cap; no lost text/action; scroll/reflow rather than truncating essential values |
| 200% web zoom / keyboard | auth/legal/Add/date picker/navigation; native-only fallback | usable focus order/visible focus, no keyboard trap, activate without touch |
| VoiceOver + TalkBack | launch/auth/consent, Home, every list, chat, date modal, Profile, errors | meaningful names/roles/checked states, full dates, focus return, announced statuses, no decorative noise |
| Touch target measurement | map recenter, calendar grid, weekday chips, tabs, links, mic and list actions | ≥44pt iOS / ≥48dp Android where applicable, no overlapping hit regions |
| Contrast | both themes; selected/focus/pressed/disabled, fields, delete, badges | text ≥4.5:1 normal / 3:1 qualifying large; required non-text cues ≥3:1; color never sole meaning |
| Reduce Motion | enabled before launch and changed while running | immediate/fade opening, Skip always available, no prolonged unfold/float/stagger/particle requirement |
| Upright content | paper panels, buttons, forms, chat/date/checklist rows | essential information upright; only decoration may tilt |
| Visible actions | delete/clear/edit, start/stop voice, back/Home/Help | all actions discoverable without swiping/long press; permanent deletes confirmed; undo where feasible |
| Cognitive load | standard + Calm across success/error/offline/empty | principal action clear; persistent instructions; no timed disappearance; guided alternatives to empty chat |
| Switch Control / Access and speech control | voice, modal, confirmation, navigation | all actions reachable with semantic labels; no hold-only dependency |
| Constellation meaning | due/overdue/packing/errand states | lists/counts explain essential state without particle color/position/animation |

## Release checklist

- [ ] Phase 1–7 acceptance evidence complete; unresolved findings explicitly accepted or fixed by the owner, never relabeled complete by documentation.
- [ ] SDK remains 57; TypeScript/Jest/lint/online Expo check/public config/diff checks pass for the release commit.
- [ ] Provider/storage, SQL/RLS, Edge Function and E2E suites run with reproducible fixtures; test/Edge Function type-checking and CI coverage gaps resolved.
- [ ] Database migrations are data-preserving, repeat-safe where intended, backed up, and recovery-tested; synchronization cannot delete other-device records.
- [ ] EAS build profiles/project and APNs/FCM credentials configured; function deployments and cron authorized; token cleanup, receipts and retry/dedupe proven.
- [ ] Local/remote/background notifications honor account, permissions and any quiet-hours policy; no delivery guarantee beyond OS support.
- [ ] Voice permission/end/stop/failure/offline behavior proven on both platforms, including slow speakers and accessible activation.
- [ ] Physical-device and accessibility matrices above completed in release builds; no source-only compliance assertion.
- [ ] Legal operator/contact/address configured; public privacy/deletion URL, processor agreements, retention/backup deletion, store disclosures and markets reviewed by appropriate owners.
- [ ] Font/art/image licenses retained; no unsupported medical/safety claim; production logs and AI payloads scrubbed/bounded; rate limits/auth negatives exercised.
- [ ] Dependency audit findings triaged, secrets verified absent, app config and policy text agree with actual behavior.

## Current external limitations

No credentials were requested or used for native signing, hosted Supabase inspection, Expo push delivery, or live Gemini evaluation. No physical device or assistive-technology session was attached for this audit. EAS project ID is missing in the resolved environment and no `eas.json` is tracked. These gaps do not block Phase 0 documentation, but they block release assertions and future native/service acceptance gates. Online dependency validation did run successfully after the sandbox's offline fallback.
