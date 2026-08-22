# B4UGO Development Guide

## Prerequisites

- **Node.js** 18+ (project tested with v24)
- **npm** 9+
- **Xcode** (for iOS Simulator) or **Android Studio** (for Android Emulator)
- **Expo Go** (optional, for physical device testing)

## Install

```bash
git clone <repo-url>
cd b4ugo-reminder-app
npm install
```

## Run

```bash
# Start Metro bundler
npm start

# Or directly:
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web browser
```

### iOS Simulator

1. Run `npm run ios`
2. Expo opens the iOS Simulator automatically
3. If simulator doesn't launch: open Xcode → Window → Devices and Simulators, then retry

### Android Emulator

1. Start an AVD in Android Studio
2. Run `npm run android`

### Physical device

1. Run `npm start`
2. Scan the QR code with Expo Go (iOS/Android)

## TypeScript

```bash
npx tsc --noEmit
```

Run this after meaningful changes. All code must pass strict TypeScript checks.

## Lint

```bash
npm run lint
```

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Design tokens

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). Never hardcode colors in components.

## Environment variables

No environment variables are required for Phase 1–2.

When added, create `.env.local` (gitignored) from `.env.example`.

## Onboarding flow (dev)

On first launch (and each new JS session), the app opens `/opening` (paper unfold + login sheet). After **come in**, it continues to `/onboarding` until setup is complete.

To reset onboarding during development:

- Use the **"Reset onboarding (dev)"** button on the Profile tab (visible only in `__DEV__` builds)
- Reload Metro to play the opening again (it is session-based, not stored)

## Common issues

| Issue | Fix |
|-------|-----|
| Metro cache stale | `npx expo start --clear` |
| iOS build fails | Ensure Xcode Command Line Tools are installed |
| Tab bar overlaps content | Should be handled by `useTabBarInset()` — report if seen |
| Type errors after token changes | Update component `ThemeColor` references |

## What not to do

- Do not commit `.env` files with real secrets
- Do not add dependencies without checking if they're needed
- Do not bypass TypeScript with `any` unless absolutely necessary
- Do not implement Phase 3+ features prematurely
