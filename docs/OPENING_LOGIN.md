# Opening / login window

This document describes the **first window only**: a scrapbook paper opening that becomes the login sheet.

No other screens were redesigned. Little Guy is **not** on this window (he is a separate character, introduced later).

---

## What you see

1. **BLUGO** wordmark near the top of the desk (Starry Night).
2. A small **crumpled paper ball** in the center.
3. The ball **unfolds** into a cream sheet with irregular edges, ruled lines, tape, a clip, and butter-yellow marks.
4. The sheet **settles** with a tiny wobble.
5. **Only then** the login copy fades onto the paper: `hello.` / `leave it here for later.` / `create account` / `log in`.

Reduce Motion skips the unfold and shows the settled sheet + login immediately.

---

## Sequence (independent stages)

Owned by `useOpeningStages` (`src/hooks/use-opening-stages.ts`).

| Stage | Time from load | What happens |
|-------|----------------|--------------|
| `logo` | 0 ms | Wordmark fades in |
| `ball` | 420 ms | Crumpled ball is visible |
| `unfold` | 980 ms | Ball exits; sheet unfolds (~1.7s, CSS 3D rotateX/Y/Z + scale) |
| `settle` | 2680 ms | Tiny settle motion (~560 ms) |
| `login` | 3380 ms | Login content fades in (~700 ms) |

Each stage can be retimed in `src/constants/opening.ts` (`openingTiming`) without rewriting the visuals.

---

## Components

All under `src/components/opening-login/`:

| Component | Role |
|-----------|------|
| `Logo` | BLUGO wordmark on the desk, not drawn into the paper |
| `PaperBall` | Illustrated wad of overlapping scraps |
| `UnfoldingPaper` | 3D-ish unfold + stationery sheet (lines, tape, clip, star, nicks) |
| `LoginContent` | Torn butter-yellow “create account” seal + quiet “log in” |
| `OpeningLogin` | Orchestrates stages |

Route: `src/app/opening/` → `/opening`.

---

## Animation approach

- **No Three.js.** No physics paper solver.
- Motion uses **CSS-style keyframes** via Reanimated 4 (`animationName`, `animationDuration`, `animationFillMode`) so it runs on iOS/Android/web.
- Transforms only (`rotateX/Y/Z`, `scale`, `opacity`, `translateY`) for performance.
- Parent `perspective: 900` sells the unfold.
- `src/components/opening-login/opening-login.css` adds a light desk grain and paper ruling on **web**, and disables CSS animation when `prefers-reduced-motion: reduce`.

---

## Typography

The intended face is **Fraunces SuperSoft Bold** (Undercase Type, OFL), loaded from:

`src/font/fraunces-supersoft-bold.ttf`

Loaded at runtime in `src/app/_layout.tsx` with Expo Font `useFonts` (SDK 57, works in Expo Go and on web):

```ts
useFonts({
  Fraunces: require('../font/fraunces-supersoft-bold.ttf'),
});
```

Used on this window for the wordmark, prompts, and both actions, and carried through the auth and onboarding screens that follow. Checklists, fields, and buttons stay on the system sans.

---

## Navigation

- Cold start with no session → `/opening` (session flag in `src/lib/opening-session.ts`).
- A returning user with a valid stored session skips this window entirely and
  lands on the tabs.
- **create account** → `/auth/create-account`; **log in** → `/auth/sign-in`.
  Both mark the opening as entered, so it doesn't replay after a sign-out.
- Opening plays once per app launch, not persisted (in-memory session only).
- Existing onboarding / tabs / providers were not replaced.

This window collects nothing. Email, password, and name are asked for on their
own screens after a path is chosen — see [AUTH.md](./AUTH.md).

---

## Visual notes (from the stationery references)

Kept on this window only:

- Cream / off-white paper, oat desk, **butter-yellow** tape / star / seal
- Soft pink backing sheet under the page
- Ruled lines, a faint margin line, washi strip, binder clip
- Slight rotation, torn nicks, tiny doodle stars/flowers
- No Material cards, glass, or heavy gradients
- No photoreal 3D objects

Intentionally **not** on this window:

- Little Guy / BLUGO character
- Other app screens
- Email/password auth
- Location, calendar, notifications

---

## Files touched

- `src/app/_layout.tsx` — load Starry Night; register opening stack
- `src/app/opening/` — route
- `src/hooks/use-onboarding-guard.ts` — allow `/opening` first
- `src/hooks/use-opening-stages.ts`
- `src/lib/opening-session.ts`
- `src/constants/opening.ts`
- `src/components/opening-login/*`
- `src/font/starrynight.ttf` — already added by you; now loaded
- `src/global.css.d.ts` — `*.css` module typing
- `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`, this file

---

## How to preview

Reload Metro (`r`). The opening should appear before onboarding.

To see it again in the same run, reload the JS bundle (opening is per session).
