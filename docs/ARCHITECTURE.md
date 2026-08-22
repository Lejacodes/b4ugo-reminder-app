# B4UGO Architecture

This document describes the high-level structure of the B4UGO mobile app.

## Stack

- **Expo SDK 57** — managed workflow, iOS + Android + web
- **React Native 0.86** — UI framework
- **TypeScript** — static typing
- **Expo Router** — file-based navigation (`src/app/`)
- **react-native-reanimated** — animations (Little Guy, particles)

## Directory layout

```
src/
├── app/                 # Routes and navigation (Expo Router)
│   ├── _layout.tsx      # Root stack, providers, session guard
│   ├── opening/         # Scrapbook login opening (first window)
│   ├── auth/            # Create account / log in
│   ├── onboarding/      # Name + "getting to know you" (after auth)
│   ├── before-ugo/      # Before U Go detail (from Home)
│   ├── on-the-way-back/ # On the Way Back detail
│   └── (tabs)/          # Main tab navigator
├── components/
│   ├── home/            # Home journey sections
│   ├── before-ugo/      # Checklist rows for the Before U Go page
│   ├── little-guy/      # Mascot placeholder + MemoryParticle
│   ├── opening-login/   # Logo, paper ball, unfolding sheet, login copy
│   ├── scrapbook/       # Shared paper/sticky primitives for auth + onboarding
│   └── ui/              # Reusable UI primitives (Button, Card, Screen, Text)
├── constants/           # Design tokens (colors, typography, spacing, …)
├── hooks/               # Shared React hooks
├── lib/
│   ├── auth/            # Provider-agnostic authentication layer
│   ├── engines/         # Reminder/context/suggestion + location stubs
│   └── storage/         # Keystore-backed storage abstractions
├── store/               # React context providers (Auth, Preferences)
└── types/               # Shared TypeScript interfaces
assets/                  # Static images and icons
docs/                    # Project documentation
```

## Navigation

| Route | Purpose |
|-------|---------|
| `/opening` | First window — paper unfold, then **create account** / **log in** |
| `/auth/create-account`, `/auth/sign-in` | Email + password |
| `/onboarding/name` | "What should I call you?" — asked once per account |
| `/onboarding/getting-to-know-you` | Sticky-note interests, skippable |
| `/before-ugo` | Before U Go — ask destination, then always / this trip / suggestions |
| `/on-the-way-back` | Things to buy/do while out |
| `/(tabs)/add` | Leave something — choose which list it belongs on |
| `/(tabs)/` | Main app — Home, Reminders, Add, Trips, Profile |

`useSessionGuard` (`src/hooks/use-session-guard.ts`) owns all of this routing.
A cold start with no session lands on `/opening`; a valid stored session goes
straight to the tabs. Authentication always precedes onboarding, so a name is
only ever asked for once there is an account to attach it to.

See [AUTH.md](./AUTH.md) for the flow and provider integration, and
[OPENING_LOGIN.md](./OPENING_LOGIN.md) for the opening sequence.

## State management

Two nested contexts, `AuthProvider` wrapping `PreferencesProvider`:

- `AuthProvider` — session status, the authenticated user, and the
  sign-up / sign-in / sign-out calls. Backed by the `AuthClient` abstraction in
  `src/lib/auth`, which no screen imports directly.
- `PreferencesProvider` — `UserProfile` (display name, interests, timestamps)
  and `UserPreferences` (notifications, reminders, privacy, onboarding flag)
  for whoever is signed in. Empties on sign-out.

Storage goes through `src/lib/storage/preferences-storage.ts`, which namespaces
every key by the authenticated user id on top of the keystore-backed
`secure-storage.ts`. This is device-local and temporary: profile data moves to
backend rows under row-level security once a backend exists.

## Design tokens

All visual values flow from `src/constants/`. Components consume semantic tokens via `useTheme()`, never raw hex values.

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for details.

## What is intentionally not built yet

- Backend / API
- Authentication
- Reminder engine
- Push notifications
- Location / geofencing
- AI / natural-language parsing
- Persistent local storage (in-memory only for now)

## Key decisions

1. **`src/app/` over root `app/`** — matches Expo SDK 57 default template.
2. **Expo Router Tabs** over NativeTabs — simpler, uses vector icons, easier to customize safe areas.
3. **Context over Redux/Zustand** — sufficient for Phase 2 preference foundation; revisit when reminder data grows.
4. **In-memory storage first** — avoids premature dependency on AsyncStorage; interface is ready for swap.
