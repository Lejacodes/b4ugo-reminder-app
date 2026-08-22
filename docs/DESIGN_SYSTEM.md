# B4UGO Design System

Central reference for visual tokens and component principles.

## Design direction

B4UGO should feel **calm, friendly, warm, minimal, trustworthy, and slightly whimsical** — appropriate for a broad public audience.

The Little Guy mascot provides most of the personality. The UI supports him rather than competing with him.

### Avoid

- Excessive pink, gradients, neon, or rainbow UI
- Overly rounded "kids app" styling
- Heavy shadows and visual clutter
- Corporate/cold aesthetics

---

## Colors

### Raw palette (`src/constants/colors.ts`)

Core brand (source of truth):

| Name | Hex | Role |
|------|-----|------|
| Matcha | `#76845B` | Accent, active states, selected controls |
| Oat | `#D8D3B3` | Desk background, secondary paper |
| Espresso | `#603314` | Main text and titles |
| Cloud | `#B1B7BE` | Borders, muted surfaces |

Related tones already in the file:

| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#F5F1E7` | Lighter paper on the oat desk |
| Deep Forest | `#465442` | Darker matcha, pressed states |
| Sage | `#9DB496` | Soft matcha |
| Cloud | `#B1B7BE` | Borders and muted UI |
| Warm gray secondary | `#7A6F65` | Secondary text (light) |
| Warm gray muted | `#8F8278` | Muted text (light, still readable) |
| Muted Coral | `#D9826B` | Warm accent |
| Dusty Rose | `#C98F9A` | Soft accent |
| Soft Aqua | `#90C5BC` | Cool accent |

Accents (Coral, Rose, Aqua) are used **intentionally** — for states, particles, and highlights — not as dominant UI colors.

### Semantic tokens (`src/constants/theme.ts`)

Components use `useTheme()` and reference semantic keys:

- **Backgrounds:** `background`, `backgroundSecondary`
- **Surfaces:** `surface`, `surfaceElevated`, `surfaceMuted`
- **Brand:** `primary`, `primaryMuted`, `secondary`, `secondarySoft`
- **Text:** `text`, `textSecondary`, `textMuted`, `textDisabled`, `textOnPrimary`, `textOnSurface`
- **Accents:** `accentWarm`, `accentRose`, `accentAqua`
- **Borders:** `border`, `borderSubtle`
- **Tab bar:** `tabBar`, `tabBarBorder`, `tabBarActive`, `tabBarInactive`, `tabBarAdd`

### Text hierarchy

| Token | Light | Use |
|-------|-------|-----|
| `text` | Espresso `#603314` | Primary content |
| `textSecondary` | Warm gray `#7A6F65` | Secondary body, inactive tabs, empty states |
| `textMuted` | Warm gray `#8F8278` | Weaker but readable supporting text |
| `textDisabled` | Cloud `#B1B7BE` | Disabled controls only |

Do **not** use `textDisabled` for normal secondary content. Cloud is for borders and muted chrome, not body copy in light mode.

### Dark mode

Deep espresso or brown-green desk. Lighter dark paper. Oat text. Cloud secondary text. Matcha accents. Not pure black, not generic gray.

Appearance is an explicit user choice (`preferences.appearance`: `light` or `dark`), persisted with the rest of preferences and applied through `useColorScheme` and `useTheme()`. It does not follow the OS unless the user picks dark.

Default is **light**. Signed-out screens stay on the light scrapbook desk.

Dark scrapbook tokens live in `scrapbookPaletteDark` (`src/constants/scrapbook.ts`):

| Role | Light | Dark |
|------|-------|------|
| Desk | Oat `#D8D3B3` | `darkSurface` `#2E261F` |
| Paper | Cream `#F5F1E7` | `darkEspresso` `#4A3828` |
| Ink | Espresso `#603314` | Oat `#D8D3B3` |
| Accent | Matcha `#76845B` | Matcha `#76845B` |
| Borders | Cloud `#B1B7BE` | Cloud `#B1B7BE` |

Do not introduce a second theme system. Scrapbook components read `useScrapbookPalette()`. Semantic chrome (tab bar, StatusBar) reads `useTheme()`.

Toggles on Profile use `ScrapbookSwitch` with Matcha when on. Never the platform blue Switch.

---

## Typography

System font on all platforms (SF Pro on iOS, Roboto on Android, Inter fallback on web).

Distinction through hierarchy, not decorative typefaces.

| Variant | Size | Weight | Use |
|---------|------|--------|-----|
| `display` | 22 | 600 | Large greetings (onboarding) |
| `heading` | 20 | 600 | Home greeting, screen titles |
| `title` | 17 | 600 | Section titles |
| `body` | 15 | 400 | Body copy |
| `bodyMedium` | 15 | 500 | Emphasized body |
| `caption` | 13 | 400 | Secondary info |
| `label` | 12 | 600 | Uppercase labels |
| `button` | 15 | 600 | Button text |

All text supports Dynamic Type via `allowFontScaling` (max 1.4× multiplier).

### Scrapbook screens: two typefaces

The opening window, auth, and onboarding screens use Starry Night alongside
the system font. The split is deliberate and defined in
`src/constants/scrapbook.ts` as `DISPLAY_FONT` and `TEXT_FONT`.

| Face | Token | Used for |
|------|-------|----------|
| Starry Night | `DISPLAY_FONT` | BLUGO wordmark, page titles, section titles, short expressive headings, field labels |
| System sans | `TEXT_FONT` | Body, list items, counts, settings, emails, dates, locations, metadata, button labels, errors, hints |

The rule: Starry Night is only used where a misread costs nothing. Anything a
person must read exactly or check character by character goes in the system
face — an address mistyped because an `l` looked like a `1` is a real failure.

Sizes come from `scrapbookType` (handwriting) and `readableType` (system).
They are separate scales because a sans face reads larger at the same point
size.

`PaperField` defaults to the readable face for typed values, with
`variant="handwritten"` available for short expressive answers like a name.

Profile follows the same split: Starry Night for "profile" / section titles;
system sans for email, preference labels, and the developer reset note.

The Profile tab icon is `leaf-outline` (matcha-earth), not a gear.

### Home screen typography

Home follows the same scrapbook split. Additional readable sizes live in
`readableType`:

| Token | Size | Use on Home |
|-------|------|-------------|
| `count` | 15 | "3 things waiting", today summary lines |
| `item` | 16 | Journey item titles |
| `meta` | 14 | Place names ("Near Carrefour"), overflow hints |

Section titles and microcopy use Starry Night via `Handwriting`. See
[HOME.md](./HOME.md) for layout and mock-data notes.

---

## Spacing

4px base scale: `xxs(4)`, `xs(8)`, `sm(12)`, `md(16)`, `lg(24)`, `xl(32)`, `xxl(48)`, `xxxl(64)`.

---

## Radius

`sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `full(9999)`.

Buttons use `md`. Cards use `lg`.

---

## Shadows

Minimal. Prefer borders and tonal surface differences. Only `shadows.sm` on primary buttons (iOS subtle shadow, Android elevation 1).

---

## Animation

Defined in `src/constants/animation.ts`. Decorative animations (Little Guy float, blink, particles) respect the system **Reduce Motion** setting via `useReducedMotion()`.

---

## Components

| Component | Location | Notes |
|-----------|----------|-------|
| `AppText` | `ui/Text.tsx` | Typography variants + theme colors |
| `Button` | `ui/Button.tsx` | primary / secondary / ghost; 44pt min touch |
| `Card` | `ui/Card.tsx` | default / muted / elevated; border-based |
| `Screen` | `ui/Screen.tsx` | SafeArea + tab bar inset + responsive max width |
| `LittleGuy` | `little-guy/LittleGuy.tsx` | Placeholder mascot — artwork TBD |
| `MemoryParticle` | `little-guy/MemoryParticle.tsx` | Colored floating particles |

### Button states

- **Primary:** Deep Forest background, cream text
- **Secondary:** Oat surface, espresso text, border
- **Ghost:** Transparent, primary text
- **Disabled:** Muted surface, cloud text, 50% interaction block
- **Pressed:** 88% opacity

### Memory particle colors

| Type | Color | Hex |
|------|-------|-----|
| reminder | Soft Aqua | `#90C5BC` |
| buy | Muted Coral | `#D9826B` |
| trip | Dusty Rose | `#C98F9A` |
| task | Sage | `#9DB496` |
| memory | Soft Matcha | `#76845B` |

---

## Accessibility

- Minimum touch target: **44pt** (`minTouchTarget` in typography tokens)
- Tab bar items: accessibility labels on every tab
- Buttons: `accessibilityRole="button"`, meaningful labels
- Text: supports Dynamic Type scaling
- Animations: respect Reduce Motion
- Contrast: Espresso on Cream, Cream on Deep Forest meet WCAG AA for normal text
