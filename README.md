# B4UGO

B4UGO is a warm, scrapbook-style reminder and travel companion built with Expo SDK 57, React Native 0.86, React 19.2.3, TypeScript, and Expo Router.

It brings together three everyday lists: what to take before leaving home, what to buy or collect on the way back, and what to prepare for a trip. Little Guy uses the same reminder, place, and trip providers as the screens. His constellation is a view of those records, not a separate memory database.

The app includes cream paper on an oat desk, matcha and espresso accents, Fraunces decorative headings, system sans-serif for essential text, and a paper-unfold opening. These are product requirements, not placeholders for a redesign.

## Current implementation

- Home departure board, persistent personal necessities, errands, and trip packing.
- Trip creation/editing, templates, and Travel Mode with places, intentions, and a native map.
- Email/password Supabase authentication, per-user local caches, and best-effort server synchronization when configured.
- Local reminder scheduling, foreground location triggers, background shop geofencing, and a server due-reminder push function.
- Little Guy with validated application tools, a local parser, and optional Gemini through a server proxy.
- Editable speech transcripts through hold-to-talk in Add and Little Guy on supported native builds.
- Profile settings, legal pages, and an account-deletion function.

This is a development baseline, not a reliability or accessibility certification. Local storage failures can be swallowed; sync still replaces collections; pending-sync/retry/conflict handling, per-device push cleanup, tap-to-talk, and Calm Mode are not implemented. Web storage is memory-only and disappears on reload. See [baseline findings](docs/BASELINE_AUDIT.md) before relying on reminders or distributing a release.

## Setup

Use Node.js **22.13.x or newer** ([SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)); the audit ran on Node 24.18.0 and npm 11.16.0. Xcode is needed for local iOS builds and Android Studio/SDK tooling for local Android builds.

```bash
git clone https://github.com/Lejacodes/b4ugo-reminder-app.git
cd b4ugo-reminder-app
npm ci
cp .env.example .env.local
```

`npm ci` reproduces the committed lockfile. Add or change Expo-compatible dependencies using `npx expo install <package>`, keeping SDK 57. The postinstall script patches intermediate ExpoModulesJSI framework signing for Desktop/iCloud paths; it does not sign or build the app.

For local development without a backend, set `EXPO_PUBLIC_AUTH_PROVIDER=none` in `.env.local`. The development placeholder accepts any password and supplies only a local identity. Release builds without usable Supabase configuration refuse authentication. Clerk/Firebase names in configuration are extension points; their auth clients are not implemented. Restart Metro after environment changes and check for conflicting values in `.env` and `.env.local`.

## Environment variables

All `EXPO_PUBLIC_*` values are readable in the shipped app. Never put privileged keys in them.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_AUTH_PROVIDER` | `none` for local development; `supabase` for real email/password auth |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key; never the service-role key |
| `EXPO_PUBLIC_AI_API_URL` | Optional HTTP(S) proxy URL or `supabase`; defaults to the `little-guy` function when Supabase is configured |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | EAS project UUID for remote push registration; absent in the audited public config |
| `EXPO_PUBLIC_LEGAL_OPERATOR_NAME` | Actual legal operator before public release |
| `EXPO_PUBLIC_LEGAL_CONTACT_EMAIL` | Monitored privacy/support contact |
| `EXPO_PUBLIC_LEGAL_BUSINESS_ADDRESS` | Actual business address |
| `GEMINI_API_KEY` | Server-only Gemini key: Supabase secret or local proxy process; never `EXPO_PUBLIC_*` |
| `GEMINI_MODEL` | Server/proxy model override; proxy defaults are `gemini-3.5-flash-lite`, while the separate client adapter still declares 2.5 |
| `LITTLE_GUY_HOST`, `LITTLE_GUY_PORT` | Local proxy bind address/port; defaults `127.0.0.1:8787` |

Cloud AI is off by default and requires opt-in during onboarding or in Profile. When enabled, the current implementation contacts the remote provider first, then falls back locally on failure; local-first dispatch and request-specific context are planned for Phase 3. The local proxy reads **`.env`**, not `.env.local`, plus process environment variables. Put its server key in its process environment or gitignored `.env`. Live model availability and quota remain unverified.

## Development commands

```bash
npm start              # Metro; launch an installed compatible app/build
npm run web            # Browser preview; no durable web storage or native features
npm run ios            # Starts local AI proxy in background, then Metro --ios
npm run android        # expo run:android; compiles/installs a native Android build
npm run ai:dev         # Local Gemini proxy only, default 127.0.0.1:8787
npx expo run:ios       # Compile/install native iOS app with local Xcode setup
```

`npm run ios` does **not** compile a new binary. An installed native build must contain the current SDK modules. A phone cannot reach the Mac through `127.0.0.1`; local proxy testing on a phone requires a reachable host/address and deliberate development-network setup. Running the proxy alone does not enable cloud AI in the app.

Use native development builds for speech recognition and background geofencing. Expo Go is a limited preview and cannot validate the full app. Verify notifications and location on physical iOS and Android devices; Android notification cold launches also need a release-build check. No `eas.json` is tracked, and EAS credentials, push credentials, deployed functions, and cron are external setup, not established by `npm start`. See [development](docs/DEVELOPMENT.md) and [Supabase setup](supabase/README.md).

`app.config.js` supplies the effective configuration and overrides the location/notification plugin entries in `app.json`. Inspect the merged result with `npx expo config --type public`.

## Verification and documentation

Phase 1 now saves records and a pending-operation outbox atomically: SQLite/WAL on native, browser storage with Web Locks on web. Server synchronization uses operation IDs, versions and explicit tombstones; conflicts retain both copies for review under Profile → Diagnostics. Credentials stay in SecureStore. Onboarding includes explained permission/privacy choices. Notifications start off; location is requested only from feature actions. On-device due scheduling is default; diagnostics offers an explicit cloud-delivery choice per installation.

Native binaries must be rebuilt with `expo-sqlite`; starting Metro does not add a native module. Server cutover requires tested migrations `0003_record_sync.sql` / `0004_push_delivery.sql`, the revised `due-reminder-push`, an EAS UUID and push credentials. Configure a 32+-character `PUSH_SCHEDULER_SECRET` and invoke the sender once per minute with POST `x-cron-secret` (and the server-side gateway Authorization token when JWT verification is enabled). Retire the old cron/client write protocol during cutover. These hosted steps have not been performed. See the exact gates in [IMPLEMENTATION_LOG.md](docs/IMPLEMENTATION_LOG.md).

```bash
npx tsc --noEmit
npm test -- --runInBand
npm run lint
npm run test:database
npm run test:push
npx expo install --check
npx expo config --type public
git diff --check
```

Phase 1 checkpoint (2026-10-30): TypeScript/lint/diff checks pass; **45 suites / 208 tests**, **20 PostgreSQL assertions**, and **10 push-handler scenarios** pass. The online SDK check reports dependencies up to date; a 34-route web export passes. Hosted/native/device/accessibility acceptance remains outstanding, and the resolved EAS project ID is absent.

- [Improvement plan and phase status](docs/IMPROVEMENT_PLAN.md)
- [Baseline audit and risks](docs/BASELINE_AUDIT.md)
- [Architecture and route/provider/repository maps](docs/ARCHITECTURE.md)
- [Testing matrix and release checklist](docs/TESTING.md)
- [Implementation log](docs/IMPLEMENTATION_LOG.md)
- [Design system](docs/DESIGN_SYSTEM.md), [security boundaries](docs/SECURITY.md), [changelog](docs/CHANGELOG.md)

Phase 0 is complete. Phase 1 is partial at a verified local checkpoint; Phases 2–7 remain gated and have not started under the revised sequence. The retained starter `reset-project` script is not a B4UGO setup or recovery command.
