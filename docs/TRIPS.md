# Trips

Planning and packing for travel and other occasions. This is not another
reminder list.

The tab at `/(tabs)/trips` is the notebook cover. Detail screens live under
`/trip/…` so they do not collide with the tab route.

---

## What is genuinely functional

- Create / edit / archive / delete a trip
- Persistent trips, packing lists, templates, and travel intentions (keystore,
  scoped to the signed-in user)
- Local packing assistant (deterministic rules from destination, duration,
  activity, season, stay, transport, and personal necessities)
- Check / uncheck / add / edit / delete / dismiss packing items
- Regenerate suggestions without removing user or existing items
- Save a trip list as a template, reuse a template (merge, no duplicates)
- Travel Mode: save / edit / delete "want to try / visit" intentions
- Before U Go can fill destination from an upcoming trip title — packing
  checkmarks on a trip never change personal necessities

Starter templates (Weekend trip, Camping, Sleepover, Beach day, International
travel) are seeded once if the template store is empty. They are not fake
user trips.

---

## What is not live

| Interface | Reality today |
|-----------|----------------|
| `PackingAssistant` | Local keyword/duration rules. Not AI. |
| `WeatherService` | Same stub as Before U Go (`isLive: false`). |
| `RecommendationEngine` | Always empty. |
| `IntentionMatcher` | No GPS. `nearby()` is empty. |

There is no Maps, geofencing, calendar, Notes, or Apple Reminders integration.

---

## State split

`PersonalNecessity` (Before U Go) — forever items such as Keys.

`PackingItem.checked` — packed for **that trip only**.

`Reminder.status` on a Before U Go checklist — packed for **that departure**.
