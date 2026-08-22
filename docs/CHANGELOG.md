# Changelog

All notable changes to B4UGO are documented here.

## [Unreleased] — Authentication + first-run onboarding

Users now authenticate before being asked for anything personal.

### Flow

- Window 1 offers **create account** / **log in** instead of a name field.
  Nothing else about that window changed — same animation, paper, palette,
  type, and decorations.
- New `/auth/create-account` and `/auth/sign-in` screens (email, password,
  confirm) in the scrapbook language.
- `/onboarding/name` restyled to match, asked once per account.
- New `/onboarding/getting-to-know-you` — sticky-note interest picker with
  multi-select and "skip for now". Fresh composition, not a copy of Window 1.
- `useSessionGuard` replaces `useOnboardingGuard` and routes on session status
  plus onboarding state. Returning users go straight to Home.
- Log out added to Profile.

### Architecture

- `src/lib/auth/` — provider-agnostic `AuthClient` contract, error mapping,
  form validation, keystore session persistence, and provider config.
- `AuthProvider` context owns session state; `PreferencesProvider` is now
  scoped to the authenticated user id.
- `expo-secure-store` added; tokens and profile data are keystore-encrypted on
  device and held in memory on web.
- **Authentication provider not yet connected.** A development placeholder
  stands in, does not verify passwords, and is barred from production builds.
  See `docs/AUTH.md`.

### Typography split

- Starry Night is now scoped to decorative text: wordmark, headings, asides,
  field labels, sticky notes, button faces (`DISPLAY_FONT`).
- The system sans takes anything read exactly or character by character:
  typed emails and passwords, error messages, password rules, hints, and
  privacy copy (`TEXT_FONT`).
- `PaperField` defaults to the readable face; `variant="handwritten"` keeps
  Starry Night for the name field.

### Auth screen polish

- Password fields gained a show/hide control with proper labels.
- Password rules moved from disappearing placeholders to persistent hints.
- Inputs lock and errors clear on edit while a request is in flight.
- Submit button keeps its width while loading instead of collapsing.
- Field underline no longer shifts by 1px on focus.
- Keyboard avoidance corrected — the bottom safe-area inset was being counted
  twice, leaving a gap above the keyboard.

### Documentation

- New `docs/AUTH.md`
- Updated `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`,
  `.env.example`
- `.gitignore` now covers all `.env*` files except `.env.example`

---

## [Unreleased] — Opening / login window

First window only: scrapbook paper opening + login on the settled sheet.

- Route `/opening` plays before onboarding/tabs once per session
- Sequence: BLUGO logo → crumpled ball → CSS 3D unfold → settle → login copy
- Starry Night loaded from `src/font/starrynight.ttf`
- Little Guy is not on this window
- Documented in `docs/OPENING_LOGIN.md`

---

## [Unreleased] — UI Refinement Pass

### Visual / UX refinement (palette unchanged)

- **Fixed text contrast** — added `textSecondary` and `textDisabled`; muted text now uses warm readable grays instead of pale Cloud blue-gray
- **Reduced copy density** — removed Home subtitle; simplified empty state to "Nothing coming up yet."; trimmed onboarding and placeholder screens
- **Home hierarchy** — smaller Little Guy (84px), greeting uses `heading` not `display`, tighter vertical rhythm
- **Card contrast** — 1px border using `theme.border` on default cards for clearer separation from Cream background
- **Button polish** — default size `medium`, removed oversized min-width, disabled uses `textDisabled`
- **Tab bar** — inactive tabs use readable warm gray; 11pt labels; consistent 22px icons; safe-area padding preserved
- **Typography** — display reduced to 22px; labels use medium weight with less letter-spacing
- **Dark mode** — matching text hierarchy with warm grays that remain readable

### Documentation

- Updated `docs/DESIGN_SYSTEM.md` — text hierarchy section
- Updated `docs/SECURITY.md` — current data storage, what's not collected, permissions deferred
- Updated `docs/CHANGELOG.md` — this pass

---

## [Unreleased] — Phase 1 Final Polish + Phase 2 Foundation

### Phase 1 — Design polish

- **Replaced color palette** with official B4UGO semantic colors (Cream, Oat, Deep Forest, Espresso, etc.)
- **Implemented genuine dark mode** — warm deep brown/green, not pure black inversion
- **Refined typography system** — display, heading, title, body, bodyMedium, caption, label, button variants
- **Improved Home screen** — better spacing, hierarchy, responsive sizing, wired Add button to Add tab
- **Polished tab bar** — dynamic safe-area insets, emphasized Add tab, filled icons on active state, accessibility labels
- **Improved Button** — Deep Forest primary, 44pt touch targets, pressed/disabled states, accessibility
- **Improved Card** — border-based surfaces (default/muted/elevated), removed heavy shadows
- **Improved Screen** — `useTabBarInset()` for proper bottom clearance, responsive max width on tablet/web
- **Accessibility** — Reduce Motion support for Little Guy, Dynamic Type scaling, tab/button labels
- **Updated splash screen** background to Cream `#F5F1E7`

### Phase 2 — Personal context foundation

- **Defined TypeScript types** — `UserProfile`, `UserPreferences`, `NotificationPreferences`, `ReminderPreferences`, `PrivacyPreferences`, `Place`, `Routine`
- **Created PreferencesProvider** — React Context for profile and preferences state
- **Created storage abstraction** — `PreferencesStorage` interface with in-memory implementation
- **Built onboarding flow** — Welcome → Name → Preferences → Complete (4 screens, no permission requests)
- **Added onboarding guard** — auto-redirect based on `hasCompletedOnboarding`
- **Updated Profile screen** — shows current preferences, dev reset button

### Documentation

- Added `docs/ARCHITECTURE.md`
- Added `docs/DESIGN_SYSTEM.md`
- Added `docs/SECURITY.md`
- Added `docs/DEVELOPMENT.md`
- Added `docs/CHANGELOG.md`

### Dependencies

- Added: none (Phase 1 polish)
- `@expo/vector-icons` was already added in Phase 1 initial setup

---

## [0.1.0] — Phase 1 Initial Foundation

- Expo SDK 57 project setup with TypeScript and Expo Router
- Initial design tokens, UI components, Little Guy placeholder, 5-tab navigation
- Home screen with welcome message and empty reminders card
