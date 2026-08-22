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

`getHomeMockData()` is gone. Home reads `ReminderProvider` (open Before U Go
items, open On the Way Back items, today counts). No destination or trip is
invented for the desk.

See [MEMORY.md](./MEMORY.md).

---

## Navigation (placeholder)

| Action | Route |
|--------|-------|
| Tap Before U Go section | `/before-ugo` |
| Tap On the way back section | `/on-the-way-back` |
| "+ leave something" | `/(tabs)/add` |

See [MEMORY.md](./MEMORY.md) for the reminder store and engine stubs.

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
