# Memory engines

How BLUGO decides what to show on Before U Go, On the Way Back, and Specific.

The UI never invents a destination. Lists come from `ReminderProvider`, which
talks to small engine interfaces in `src/lib/engines/`.

---

## What is genuinely functional (local)

- Create / check / uncheck reminders
- Persistence via the existing keystore store, scoped to the signed-in user
  (`blugo.reminders`, `blugo.context`)
- Before U Go asks **where are you going?** until the user types a destination
- After a destination exists, a **local rule table** fills "for this trip"
  (university → laptop, gym → sneakers, etc.)
- Always items (starter pack: Keys, Phone, Wallet, Charger) plus user-added ones
- On the Way Back items with optional **place name** (no coordinates)
- Specific memories on the Reminders tab
- Leave something (`/(tabs)/add`) chooses Before U Go / On the Way Back / Specific
- Home counts and previews come from this store, not hardcoded lists

Checked state survives leaving the screen and (on iOS/Android) app restart.
On web, SecureStore is in-memory so a reload clears it — same as auth sessions.

---

## What is a local stub, not live

| Interface | File | Reality today |
|-----------|------|----------------|
| `SuggestionEngine` | `suggestion-engine.ts` | Keyword packs. Not a model. |
| `WeatherService` | `weather-service.ts` | Fixed development snapshot (`isLive: false`). Not a weather API. Suggestions that mention rain/cold come from this stub. |
| `LocationService` | `location-services.ts` | `isAvailable()` is false. No GPS. |
| `PlaceService` | same | Saves the typed name only. No Maps/Places. |
| `GeofenceService` | same | No-op. |
| `NotificationService` | same | No-op. |

There is **no backend, no AI, no Google Maps, no geofencing, no push
notifications**. Nearby-store alerts cannot fire until those exist.

---

## Plug-in point

Replace the `Local*` classes and keep the interfaces. `ReminderProvider` already
calls `suggestionEngine` and `weatherService` when the user sets a destination.

Starter Always items are seeded once if the store is empty (`source: learned`).
They are defaults, not a fake trip.
