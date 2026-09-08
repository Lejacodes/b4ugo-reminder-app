# Dynamic constellation + swipe-delete packing

Date: 2026-09-08

## Little Guy sparks

- `src/lib/ai/constellation.ts` — one spark per unresolved item (Before U Go, On the Way Back, unchecked necessities, packing). Cap 10. Colors by urgency: coral/amber, sage/green, gold, blue.
- `src/store/LittleGuyProvider.tsx` — constellation rebuilds from reminder + trip store updates, so Add/Chat create and check/delete fade sparks immediately on Home header and `/little-guy`.
- `src/lib/ai/pixels-to-particles.ts` — slots hashed by item id so remaining sparks stay put.

## Checked trip packing

- `src/lib/home/departing-trips.ts` — checked packing stays on Home / Before U Go so it can be swipe-deleted.
- `src/app/trip/[id]/packing.tsx` — packing rows swipe left to delete (or dismiss a suggestion).

---

# Compact header, vector icons, hold-to-speak

Date: 2026-09-08

## Home companion

- `src/components/home/HomeHeader.tsx` — compact Little Guy sits top-right of the greeting/status row and opens `/little-guy`.
- `src/components/little-guy/LittleGuyPresence.tsx` — `compact` variant keeps constellation dots, drops the whisper.
- `src/app/(tabs)/index.tsx` — body-stage Little Guy removed so the board can start immediately.

## Icons and copy

- `src/components/home/BeforeUgoSection.tsx` — Ionicons plane; no “take with you” / “things waiting”. Clear checked is `flexShrink: 0` on one header row.
- `src/components/home/OnTheWayBackSection.tsx` — Feather `corner-down-left`; no “along your way”.
- `src/components/home/WeatherBadgeMark.tsx` — rain / cold / sun badges use Feather icons, not emoji.
- `src/lib/context/weather-injections.ts` — badge labels are text-only (`Rain Expected`, `Cold`, `High UV`).
- `src/app/(tabs)/add.tsx` — target chips use Feather icons instead of emoji.
- `src/lib/ai/little-guy-mood.ts` — dropped the “one little thing to remember today” whisper.
- `src/components/before-ugo/BeforeUgoPaperSection.tsx` — title `numberOfLines={1}` so Clear checked cannot overlap.

## Dev tools gear

- `src/lib/dev/hide-dev-tools-button.ts` + `src/app/_layout.tsx` — hide Expo’s floating blue tools button (`showFloatingActionButton: false`). Shake / ⌘D still opens the menu.

## Little Guy chat

- `src/app/little-guy/index.tsx` — hold-to-speak mic beside the input, same `useHoldToSpeak` path as Add. Transcript fills the draft field.
- `src/lib/voice/hold-to-speak.ts` — never import `expo-speech-recognition` (that package throws in Expo Go). Probe `ExpoSpeechRecognition` with `requireOptionalNativeModule` so typing still works without a native rebuild.

---

# STEP 3 refactor log — unified trips engine, AI guardrails, offline sync

Date: 2026-09-08

## Unified packing on Home

- `src/lib/home/departing-trips.ts` — a trip injects packing when `startDate` is today or `status === 'active'`.
- `src/lib/home/departure-board.ts` — incomplete packing rows are `persistKind: 'packing'` and win over cloned this-trip reminder extras.
- `src/hooks/use-home-board.ts` — checks/deletes go through `togglePackingItem` / `deletePackingItem`.
- `src/lib/home/clear-checked.ts` — packed trip items stay on the trip; they are not deleted.
- `src/app/before-ugo/index.tsx` — same packing list as Home when a trip is departing.
- `src/store/ReminderProvider.tsx` — destination extras skip titles already on today's trip packing list.
- `src/types/home.ts` — `kind: 'packing'`.

## Little Guy verified tools

- `src/lib/ai/tool-result.ts` — mutation payloads must include `success` + `deletedCount`; 0 deletions speak: `I couldn't find any checked items to remove.`
- `src/lib/ai/chat-service.ts` + `src/lib/ai/fallback-provider.ts` — tools run first; the model’s pre-tool success claim is dropped for deletes.
- `src/store/LittleGuyProvider.tsx` — execute inspects the store, then returns counts. `completeAllReminders` only toggles open rows.
- `src/lib/ai/ai-prompts.ts` — system prompt forbids claiming a delete without a verified payload.

## Offline-first Supabase

- `src/lib/places/place-store.ts` — local write first; remote upsert is try/caught.
- `src/store/PreferencesProvider.tsx` — remote profile/preferences load cannot wipe the local cache on network failure.
- Reminders and trips already wrote local keystore first (`src/lib/engines/reminder-store.ts`, `src/lib/trips/trip-store.ts`).

## Tests

- `src/lib/home/__tests__/departing-trips.test.ts`
- `src/lib/home/__tests__/departure-board.test.ts`
- `src/lib/home/__tests__/clear-checked.test.ts`
- `src/lib/home/__tests__/trip-extras.test.ts`
- `src/lib/ai/__tests__/tool-result.test.ts`
- `src/lib/ai/__tests__/chat-service.test.ts`
- `src/lib/ai/__tests__/ai-tools.test.ts`

---

# STEP 2 refactor log — capture consolidation & list actions

Date: 2026-09-08

## Storage integrity (no necessity clones)

- `src/store/ReminderProvider.tsx` — `setGoingTo` no longer copies PersonalNecessity into `contextId` reminder rows. Session lives on the same store. `clearGoingTo` drops leftover context rows (local + Supabase via `replaceReminders`) and resets `blugo.departureSession`. `addAlways` only writes the necessity record.
- `src/lib/reminders/context-rows.ts` — strip cloned `layer: 'always'` + `contextId` rows on load.
- `src/lib/reminders/__tests__/context-rows.test.ts`
- `src/lib/home/trip-extras.ts` — destination extras only (`thisTrip` / `suggestion`).
- `src/lib/home/__tests__/trip-extras.test.ts`
- `src/lib/home/departure-session.ts` — `cleared` keys for “Clear checked” session rows.
- `src/lib/home/clear-checked.ts` + `src/lib/home/__tests__/clear-checked.test.ts`
- `src/lib/home/departure-board.ts` + `src/lib/home/__tests__/departure-board.test.ts` + `src/lib/home/__tests__/departure-session.test.ts`
- `src/hooks/use-home-board.ts` — reads/writes the store session; delete + clear checked.

## Single capture path

- Deleted `src/components/before-ugo/AddItemComposer.tsx`
- `src/app/before-ugo/index.tsx` — necessities are session-checked; no inline composer; link to Add.
- `src/components/on-the-way-back/OnTheWayBackDesk.tsx` — composer removed; Add tab only.
- `src/app/(tabs)/add.tsx` — default target is Before I leave.
- `src/lib/add/classify-intent.ts` + `src/lib/add/__tests__/classify-intent.test.ts` — trip chip only for packing language.

## Swipe-to-delete & Clear checked

- Created `src/components/lists/SwipeDeleteRow.tsx` (RNGH ReanimatedSwipeable).
- `src/components/before-ugo/ChecklistItem.tsx`
- `src/components/before-ugo/BeforeUgoPaperSection.tsx`
- `src/components/home/BeforeUgoSection.tsx`
- `src/components/home/TodayItemsSection.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/_layout.tsx` — `GestureHandlerRootView`

---

# STEP 1 refactor log — doorway performance & readability


Date: 2026-09-08

## Launch / paper unfold

- `src/lib/launch/resolve-launch-target.ts` — signed-in + onboarded → `/(tabs)`; paper unfold only for signed-out first run / re-auth.
- `src/lib/launch/__tests__/resolve-launch-target.test.ts`
- `src/hooks/use-session-guard.ts` — splash stays up until the target route is chosen.
- `src/app/opening/index.tsx` — returning signed-in sessions do not mount `OpeningLogin`.
- `src/lib/opening-session.ts` — `clearOpeningSession()` on logout so the next login can unfold again.
- `src/store/AuthProvider.tsx` — clears the opening session on sign-out.
- `src/app/_layout.tsx` — root stack headers off; splash hidden by the guard, not on mount.

## Home doorway (no destination gate)

- `src/lib/home/departure-board.ts` — Keys / Phone / Wallet / weather rows render with no trip.
- `src/lib/home/__tests__/departure-board.test.ts`
- `src/hooks/use-home-board.ts`
- `src/app/(tabs)/index.tsx` — empty hint is “all set”, never “where are you going?”.
- `src/components/home/BeforeUgoSection.tsx`
- `src/components/home/TodayItemsSection.tsx`
- `src/components/home/OnTheWayBackSection.tsx`
- `src/components/home/HomeHeader.tsx` — B4UGO wordmark stays Starry Night; greeting/status use system sans.
- `src/components/home/index.ts` — `TodayNote` no longer exported (duplicate Home sticky).

## Typography (iOS Starry Night leak)

- `src/constants/typography.ts` — iOS omits `fontFamily` (never `"System"`).
- `src/constants/scrapbook.ts` — `readableFont` omits the key on iOS; Starry Night only for logo, screen titles, Little Guy lines.
- Checklist / fields / buttons / badges now spread `readableFont` instead of `fontFamily: TEXT_FONT` (undefined on iOS was leaking Starry Night):
  - `src/components/before-ugo/BeforeUgoPaperSection.tsx`
  - `src/components/before-ugo/ChecklistItem.tsx`
  - `src/components/before-ugo/AddItemComposer.tsx`
  - `src/components/before-ugo/ContextPrompt.tsx`
  - `src/components/scrapbook/ButterButton.tsx`
  - `src/components/scrapbook/PaperField.tsx`
  - `src/components/scrapbook/DateField.tsx`
  - `src/components/scrapbook/QuietLink.tsx`
  - `src/components/scrapbook/StickyNote.tsx`
  - `src/components/scrapbook/SlipNote.tsx`
  - `src/components/scrapbook/PlaceAutocomplete.tsx`
  - `src/components/scrapbook/PlaceholderAuthNotice.tsx`
  - `src/components/on-the-way-back/OnTheWayBackDesk.tsx`
  - `src/components/trips/TripFormFields.tsx`
  - `src/components/trips/TripCard.tsx`
  - `src/components/trips/ChipRow.tsx`
  - `src/components/trips/IntentionComposer.tsx`
  - `src/components/map/LiveMap.tsx`
  - `src/app/(tabs)/add.tsx`
  - `src/app/(tabs)/trips.tsx`
  - `src/app/(tabs)/profile.tsx`
  - `src/app/before-ugo/index.tsx`
  - `src/app/auth/sign-in.tsx`
  - `src/app/auth/create-account.tsx`
  - `src/app/onboarding/name.tsx`
  - `src/app/onboarding/getting-to-know-you.tsx`
  - `src/app/trip/**` screens that used `TEXT_FONT`
- Little Guy dialogue stays Starry Night: `src/components/little-guy/LittleGuyPresence.tsx`, `src/components/little-guy/ChatBubble.tsx` (assistant), `src/app/little-guy/index.tsx` whispers.

## Dark mode & Little Guy

- `src/constants/colors.ts` — Deep Slate-Matcha; `guyBody` locked to `#FFFDF7`.
- `src/constants/scrapbook.ts` — `scrapbookPaletteDark`.
- `src/constants/theme.ts` — dark semantic tokens.
- `src/components/opening-login/opening-login.css` — dark desk `#121614`.
- `src/components/little-guy/LittleGuy.tsx` — no dark invert / color filter.

## Settings chrome

- Stack/tab layouts force `headerShown: false` and `headerRight: () => null` so Expo’s default header control cannot appear. Profile remains the settings surface (`src/app/(tabs)/profile.tsx`). A blue circular gear in Expo Go is the native developer menu, not app UI.

---

# Phase 2 refactor log — Home control center, Smart Add, weather


Date: 2026-09-07

## Home Context Control Center

- `src/app/(tabs)/index.tsx` — Home reads `useHomeBoard` for status, a checkable Before U Go board, and grouped errands.
- `src/hooks/use-home-board.ts` — GPS + Open-Meteo + departure session. Toggles go through existing reminder store or a same-day session map.
- `src/lib/home/context-status.ts` — “Leaving for Uni • 18°C Rain Expected” / “At Home • Quiet Evening”.
- `src/lib/home/departure-board.ts` — Merges personal necessities with trip copies and weather injections. Necessity rows are session-checked only.
- `src/lib/home/departure-session.ts` — Day-scoped checks / dismissed weather ids in existing secure storage (`blugo.departureSession`).
- `src/lib/home/group-errands.ts` — Groups On the Way Back items by saved place.
- `src/components/home/HomeHeader.tsx` — Status line under the greeting.
- `src/components/home/BeforeUgoSection.tsx` — Checkable slips + weather badges. Header still opens the full Before U Go desk.
- `src/components/home/OnTheWayBackSection.tsx` — Place-grouped preview (`PetZone: Buy cat food`).
- `src/types/home.ts` — Optional checked/badge fields and errand groups.
- `src/lib/ai/constellation.ts` + `src/store/LittleGuyProvider.tsx` — Constellation also reflects persistent necessities.

## Unified Smart Add

- `src/app/(tabs)/add.tsx` — One field (“What do you need to remember?”), hold-to-speak mic, three override chips.
- `src/lib/add/classify-intent.ts` — `interpretLocally` plus place/trip heuristics.
- `src/hooks/use-hold-to-speak.ts` + `src/lib/voice/hold-to-speak.ts` — Press-in / press-out speech. Native module is optional (Expo Go falls back to typing).
- `expo-speech-recognition` added; plugin configured in `app.config.js`.

## Weather rules

- `src/lib/engines/contracts.ts` — Optional `precipitationProbability` and `uvIndex` on `WeatherSnapshot`.
- `src/lib/weather/open-meteo.ts` — Fetches `uv_index_max`; rain threshold is > 40%.
- `src/lib/context/weather-injections.ts` — Rain / cold / heat-UV injections with badges.
- `src/lib/engines/suggestion-engine.ts` — Trip checklist weather extras use the same rules.
- `src/lib/context/index.ts` — Re-exports the injection helpers.
- `src/lib/storage/preferences-storage.ts` — `departureSession` key.

## Tests

- `src/lib/context/__tests__/weather-injections.test.ts`
- `src/lib/home/__tests__/context-status.test.ts`
- `src/lib/home/__tests__/departure-board.test.ts`
- `src/lib/home/__tests__/departure-session.test.ts`
- `src/lib/home/__tests__/group-errands.test.ts`
- `src/lib/add/__tests__/classify-intent.test.ts`

---

# Phase 1 refactor log — typography, polish, navigation

Date: 2026-09-07

## Typography tokens

- `src/constants/scrapbook.ts`
  - Starry Night (`DISPLAY_FONT`) is limited to the B4UGO wordmark, screen titles, section headers, and Little Guy personality lines.
  - `paperTilts` now stays between `1deg` and `2deg` (`-1.4`, `1.1`, `-1.7`, `1.8`, `-2`, `1.2`).
- `src/components/scrapbook/PaperField.tsx` — field labels use the system face (`TEXT_FONT`, Medium).
- `src/components/scrapbook/DateField.tsx` — date labels use the system face.
- `src/components/scrapbook/StickyNote.tsx` — chip labels and asides use the system face.
- `src/components/scrapbook/QuietLink.tsx` — Medium weight on interactive text.
- `src/app/(tabs)/_layout.tsx` — tab labels use Semibold.

## Decorative vs readable copy

Handwriting kept for titles / Little Guy:

- Wordmark and greetings: `src/components/home/HomeHeader.tsx` (`hey, {name} ♡`)
- Little Guy whispers: `src/components/little-guy/LittleGuyPresence.tsx`
- Screen titles (`add`, `trips`, `profile`, `on the way back`, `before u go`)

System face for body, labels, and asides:

- `src/components/before-ugo/BeforeUgoPaperSection.tsx`
- `src/components/before-ugo/AddItemComposer.tsx`
- `src/app/auth/sign-in.tsx`
- `src/app/auth/create-account.tsx`
- `src/app/onboarding/name.tsx`
- `src/app/onboarding/getting-to-know-you.tsx`
- `src/app/trip/[id]/packing.tsx`
- `src/app/trip/templates/[id].tsx`

## Navigation

- `src/app/(tabs)/_layout.tsx` — five tabs: **Home**, **On the Way Back**, **Add**, **Trips**, **Profile**.
- Created `src/app/(tabs)/on-the-way-back.tsx` (tab).
- Created `src/components/on-the-way-back/OnTheWayBackDesk.tsx` (shared desk UI).
- `src/app/on-the-way-back/index.tsx` now redirects to the tab.
- Deleted `src/app/(tabs)/reminders.tsx` (the “specific” tab).
- Created `src/app/reminders.tsx` — legacy `/reminders` deep links redirect to Home.
- `src/app/_layout.tsx` — registered the reminders redirect route.

## Specific / anytime cleanup

- Add form label is **Anytime** (internal category still `specific`).
- Add screen title is **add** (no “leave something”).
- Home shows leftover anytime items in `src/components/home/TodayItemsSection.tsx` under **today**.
- Notification / evaluation hrefs for untagged items go to `/(tabs)` instead of `/reminders`.

## Duplicate create trigger

- Removed the Home `+ leave something` button from `src/app/(tabs)/index.tsx`.
- The center tab **Add** is the create entry point.

## Visual polish

- Home section doodle icons capped at `±2deg`.
- No floating settings-gear control existed in source; Profile remains the settings surface (leaf icon, no extra gear).

## Docs

- `docs/DESIGN_SYSTEM.md` — Starry Night / system-sans table updated.
- `docs/CHANGELOG.md` — Phase 1 entry added.
