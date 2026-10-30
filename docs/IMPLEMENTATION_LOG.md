# Implementation log

## 2026-10-30 — Phase 1 reliability checkpoint

Status: **partial; automated local gates pass, native/deployment acceptance open**. Phases 2–7 have not started. This checkpoint follows the owner's revised sequence, which combines the original plan's persistence/sync/delivery work into Phase 1. The Phase 0 audit was read, not repeated. Existing README/architecture/audit/testing work and duplicate `README 2.md` / `ARCHITECTURE 2.md` files were preserved.

### Objective and decisions

Make saves durable and truthful before daily-experience, AI, voice or care-partner expansion. Preserve the existing scrapbook design and opening. Follow the exact SDK 57 references for SQLite, Location and Notifications; no SDK upgrade.

- Native: `expo-sqlite ~57.0.4`, WAL, bound SQL, exclusive migration transaction. Web: localStorage atomic value replacement plus Web Locks around account mutations. Browser storage/locking failures reject saves; server rendering cannot pretend to persist data.
- Store records, tombstones, device-only departure checks and pending operations in one account envelope. SQLite commits it as one value; this favors an atomic migration/command boundary over a premature normalized local schema. Large-list tests cover 1,500 imported records and 5,000 SQLite values; no device latency benchmark is claimed.
- Preserve SecureStore snapshots until verified, and fail/retry on unreadable migration sources. Never import the old unowned global device snapshot. Credentials remain in SecureStore.
- Synchronize per record using operation IDs and expected revisions. Retry at bounded exponential delays, at most 50 attempts and three failed requests per drain. A conflict preserves both versions. Choosing the remote version requires explicit UI confirmation and creates local recovery evidence before replacing the proposal.
- Remove destructive server collection-replacement code. Compatibility repository names delegate to local commands/outbox. The SQL cutover retains old tables for evidence and revokes the old client write protocol.
- Keep device checks separate from trip packing and exclude checks from sync. Publish provider state after commit. Reminder/essential/trip/packing/intention creation distinguishes persisted/unchanged; write failures reject. Add/trip errors retain input; shared scrapbook actions retain an accessible error until retry. Little Guy creation success waits for the service result.
- Remount account-scoped providers before logout/deletion and reject outgoing callbacks. Successful deletion drains/stops the outgoing local repository and erases scoped SQLite/browser and SecureStore recovery data.
- Notifications default off. Interests lead to permission/privacy choices. Foreground location is requested only from explicit feature actions; background permission is separate. Automatic map/search/background permission prompts were removed. Unsupported quiet-hours fields were removed.
- Registration uses a persistent installation ID, token rotation/reconnect retry and installation-only deletion. Local scheduling is the default due-delivery route; diagnostics can switch this installation to cloud delivery after registration. Server messages contain generic text. A cloud delivery receipt is upstream acknowledgement, not proof the user saw a notification.
- The sender authorizes scheduled POSTs with a separate 32+-character secret, claims work in SQL, logs acceptance only from individual Expo tickets, processes receipts, removes invalid tokens and treats lost submission responses as uncertain rather than duplicating them. Catch-up is limited to 24 hours. Claims use `SKIP LOCKED`.
- Geofences start without a pre-existing registration, cap regions at 20 iOS/100 Android, serialize replacement/cleanup and fence stale work. Logout bounds each cleanup step to five seconds and cancels outgoing scheduled alerts.

### Files added

- `src/lib/sync/{repository,local,transport}.ts` and repository/provider integration tests.
- `src/lib/storage/record-storage-{contract,impl}.ts`, `record-storage-impl.web.ts`, `record-storage.{native,web}.ts`, `mutation-result.ts`, checksum/native SQLite tests.
- `src/hooks/{use-account-guard,use-record-revision,use-async-action}.ts`; mounted scrapbook-button pending/failure/retry tests.
- `src/store/{SyncProvider,NotificationDeliveryProvider}.tsx`.
- `src/app/diagnostics.tsx`.
- `src/lib/notifications/{installation,push-delivery}.ts` and push-delivery tests.
- `supabase/migrations/{0003_record_sync,0004_push_delivery}.sql`.
- `scripts/{test-database,test-push-sender}.mjs`.

### Files changed

- Application root and Auth/Preferences/Reminder/Trip/Place/PushNotification/ContextIntelligence/LittleGuy providers.
- Reminder, trip, place and profile compatibility repositories/stores; legacy migration facade; departure-session persistence; storage abstraction and preference types.
- Onboarding interests/preferences; Add, Profile, Little Guy, trip new/edit/packing; shared scrapbook ButterButton/QuietLink; device-location hook/place autocomplete.
- Push registration, bounded sign-out, notification service, Wi-Fi departure watcher, geofence sync/task, and `due-reminder-push` Edge Function.
- `app.config.js`, `package.json`, lockfile, README, source-directory READMEs, Supabase setup README, SECURITY, IMPROVEMENT_PLAN, ARCHITECTURE, TESTING, CHANGELOG and this log.

### Database/configuration changes

- `0003_record_sync.sql`: data-preserving legacy backfill, canonical `domain_records`, `record_operations`, read-own RLS, authenticated compare-and-swap RPC, parent-owner checks, trip child tombstones, and retirement of legacy direct writes. Old server tables remain recoverable. **Not applied to a hosted project.**
- `0004_push_delivery.sql`: installation/delivery-route columns, unique installation index, per-token delivery attempts, owner-read RLS and service-only claim RPC. **Not applied to a hosted project.**
- SQLite plugin merged into dynamic app config. Rebuild native binaries; `npm run ios` alone does not install the new module.
- Added development-only PGlite and `test:database` / `test:push` scripts. It is not imported by application runtime code.
- Effective config: SDK `57.0.0`; SQLite/Location/Notifications/Speech plugins resolve. `extra.eas.projectId` is absent. No hosted resources, user records, cron or secrets were modified.

### Verification evidence

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Exit 0, no diagnostics |
| `npm test -- --runInBand` | 45 suites passed / 208 tests passed / 0 snapshots |
| `npm run lint` | Exit 0, no errors or warnings |
| `npm run test:database` | 20 assertions passed in isolated PGlite PostgreSQL: migrations 0001–0004, backfill, idempotency, revisions, RLS, parent ownership, cascade, anonymous denial, legacy-token adoption, installation isolation and exclusive delivery claims |
| `npm run test:push` | 10 actual-handler scenarios passed with injected database/Expo endpoint: auth, tickets, receipt cleanup, overlap, retries, unknown response, delivery route, no early send |
| `git diff --check` | Exit 0, no whitespace diagnostics |
| `npx expo install --check` | Online-approved run: `Dependencies are up to date`, exit 0; earlier sandbox fallback was qualified as offline |
| `npx expo config --type public --json` | Exit 0; SDK 57 and required plugins present; EAS project ID missing |
| `npx expo export --platform web --output-dir <temporary directory>` | Exit 0; final 34-route export including `/diagnostics`: `/tmp/b4ugo-phase1-final-web.AdatHz` |
| `xcrun simctl list devices booted` | Approved retry exit 0; iOS 26.5 runtime listed, no booted device. Initial sandbox attempt could not contact CoreSimulator |

The SQLite tests execute production migration/storage logic through a small adapter backed by Node's actual SQLite engine. Mounted-provider tests execute real ReminderProvider commands and the real local repository with fault-injected durable storage. PGlite tests use synthetic Supabase auth roles; they do not certify hosted gateway/cron configuration. The push-handler test transpiles and executes the handler with injected dependencies; Deno deployment/type validation remains separate. Existing Jest tests and lint rules were retained.

### Review and known limits

- Security/privacy: new writes require an authenticated owner and expected version; foreign packing/intention/reminder-parent links are rejected. No service/Gemini secret entered the client. New remote push text is generic. Existing AI context/confirmation weaknesses remain Phase 3 work; this checkpoint does not certify cloud-AI privacy beyond the retained opt-in/account isolation.
- Offline/data loss: one durable commit owns both records and outbox; failed/corrupt/interrupted imports retain recovery evidence. No remote absence implies delete. Outbox/receipts/tombstones currently need a retention/compaction policy before very large long-lived accounts. Browser persistence can be cleared by the browser/user and is accessible to same-origin script. Native domain records use the OS app sandbox; SQLCipher/application-level database encryption is not enabled. SECURITY now distinguishes this from encrypted credential storage; review the release storage threat model before release.
- Synchronization runs while the app is active and after restart/reconnect, not as a guaranteed background task. Conflict resolution currently supports taking the remote version while retaining the local proposal; reapplying selected local edits is manual. There is no automatic merge of two changed fields.
- Native permissions, geofences, low-space/process-death behavior and APNs/FCM are not certified by these tests. Offline logout cannot guarantee immediate server deregistration; cleanup failure is bounded. Generic remote content reduces exposure but cannot recall a notification already accepted by the OS.
- Delivery-mode switching spans server/local/OS operations. Validate interruption at each step before enabling cloud delivery in release. Expo cannot guarantee exactly-once display or user acknowledgement. `delivered` in the attempts table means receipt success from Expo's upstream provider.
- Accessibility: new errors/statuses are textual and announced; existing global text caps, hidden gestures, rotation and screen-reader issues are still Phase 5 work. No VoiceOver/TalkBack or physical-device result is claimed.
- Existing native `ios/` and `android/` projects require module autolinking/rebuild and native configuration verification. No native project regeneration was performed.

### First incomplete follow-up — Phase 1 acceptance gate

1. Select an isolated Supabase test project and take a recoverable backup; apply 0003/0004 there, then run authenticated two-user/two-device reconnect, conflicts, parent-ownership and token-isolation tests against the real gateway. Stop the old cron and retire old binaries before any production cutover because the old write protocol is revoked. No hosted migration was performed during local tests.
2. Deno-check/deploy `due-reminder-push`; configure a scheduler-only secret and POST `x-cron-secret`; invoke once per minute. If gateway JWT verification remains enabled, the server-side scheduler must also supply its valid gateway Authorization bearer token; the handler secret is required independently. Set the EAS UUID and APNs/FCM credentials. Prove unauthorized rejection, missed-cron catch-up, tickets/receipts, token rotation, invalid-token removal and delivery-route handoff with isolated fixtures.
3. Build/install SDK 57 binaries containing SQLite. Run clean onboarding (all choices, allow/deny/revoke), offline Add → terminate → relaunch → sync, low-space/interruption, account switch/logout while work is pending, and native geofence first-start/races on iOS and Android. Use two installations to prove logging out A leaves B registered. Validate browser reload/storage denial and Web Locks in the actual hosted origin.
4. Capture release notification cold/warm launches and device/accessibility evidence from TESTING. Only after Phase 1 acceptance passes, mark it complete and begin Phase 2 Daily Experience. No later phase was interleaved.
