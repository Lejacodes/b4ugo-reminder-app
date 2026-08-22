# Home screen

Home is the product's front door. It exists to answer one question:

**"What do I need to remember around my journey today?"**

It is not a dashboard, a task list, or a calendar. The two dominant ideas are
**Before U Go** and **On the way back** — everything else is secondary.

---

## Layout hierarchy

```
BLUGO ✦
hey, {name} ♡

┌ Before U Go ✈ ─────────────┐   ← primary: take before leaving
│ 3 things waiting           │
│ take these with you        │
│ □ Laptop …                 │
└────────────────────────────┘

┌ On the way back ↩ ─────────┐   ← distinct: remember near places
│ 2 things waiting           │
│ along your way             │
│ • Buy cat food             │
│   Near Carrefour           │
└────────────────────────────┘

      today ✦                  ← quiet summary slip

   + leave something           ← opens Add tab
```

Little Guy is intentionally absent. Home must communicate the concept without
the mascot.

---

## Files

| Path | Role |
|------|------|
| `src/app/(tabs)/index.tsx` | Screen composition |
| `src/components/home/` | Header, journey sections, today note, fade-in wrapper |
| `src/types/home.ts` | Journey data types |
| `src/lib/home/mock-data.ts` | Mock dataset + copy helpers |

Reused scrapbook primitives: `PaperPanel`, `Handwriting`, `ButterButton`.

---

## Mock data

`getHomeMockData()` in `src/lib/home/mock-data.ts` returns a static object:

- `beforeUgo` — items to take before leaving (no place attached)
- `onTheWayBack` — items with a `placeName` for contextual surfacing later
- `today` — aggregate counts and an optional upcoming trip

Replace this function with a real fetch when the reminder engine exists.
The UI components accept typed props and do not import the mock module
directly except from the screen.

**Nothing is persisted, geofenced, or location-aware yet.**

---

## Navigation (placeholder)

| Action | Route |
|--------|-------|
| Tap Before U Go section | `/(tabs)/reminders` |
| Tap On the way back section | `/(tabs)/reminders` |
| "+ leave something" | `/(tabs)/add` |

Full list experiences and filtering by journey kind are not implemented.

---

## Typography

Follows the scrapbook split documented in `DESIGN_SYSTEM.md`:

- **Starry Night** — wordmark, section titles, microcopy ("take these with you")
- **System sans** — counts, item labels, place names, today lines

---

## Animation

Sections fade up with a short stagger (`FadeInSection`). Disabled when Reduce
Motion is on. No bouncing cards or floating elements.

---

## Intentionally not implemented

- Geofencing / background location
- Maps or place APIs
- Push notifications
- AI parsing
- Backend / database sync
- Little Guy on Home
- Separate Before U Go / On the way back list screens (Reminders tab is the placeholder)
- Item completion toggles (checkboxes are visual only)

---

## Revision history

See [CHANGELOG.md](./CHANGELOG.md).
