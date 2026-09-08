import { weatherBadgeForText, weatherBadgeIconForText, weatherKey, type WeatherBadgeIcon, type WeatherInjection } from '@/lib/context/weather-injections';
import { packingBoardId } from '@/lib/home/departing-trips';
import { sessionCheckKey } from '@/lib/home/departure-session';
import { isNecessityActiveToday } from '@/lib/reminders/necessity-days';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';
import { titlesMatch } from '@/types/reminder';
import type { PackingItem } from '@/types/trip';

export type DepartureBoardKind = 'reminder' | 'necessity' | 'weather' | 'packing';
export type DeparturePersistKind = 'reminder' | 'session' | 'packing';

export type DepartureBoardItem = {
  id: string;
  title: string;
  checked: boolean;
  kind: DepartureBoardKind;
  persistKind: DeparturePersistKind;
  reminderId?: string;
  necessityId?: string;
  weatherId?: string;
  packingItemId?: string;
  tripId?: string;
  badge?: string | null;
  badgeIcon?: WeatherBadgeIcon | null;
};

export type BuildDepartureBoardInput = {
  context: BeforeUgoContext | null;
  tripReminders: Reminder[];
  necessities: PersonalNecessity[];
  weatherItems: WeatherInjection[];
  sessionChecks: Record<string, boolean>;
  dismissedWeather: string[];
  cleared?: string[];
  packingItems?: PackingItem[];
  /** Override for tests. Defaults to `new Date().getDay()`. */
  dayOfWeek?: number;
};

/**
 * Doorway board: persistent necessities + live weather, always.
 *
 * Same-day / active trip packing is injected from the Trips store so Home
 * checks write `trip_items` instead of a second reminder list. Destination
 * extras stay optional and are skipped when packing is already on the board.
 */
export function buildDepartureBoard(input: BuildDepartureBoardInput): DepartureBoardItem[] {
  const taken = new Set<string>();
  const out: DepartureBoardItem[] = [];

  const remember = (title: string) => taken.add(title.trim().toLowerCase());
  const seen = (title: string) => taken.has(title.trim().toLowerCase());

  const cleared = new Set(input.cleared ?? []);
  const dayOfWeek = input.dayOfWeek ?? new Date().getDay();

  for (const necessity of input.necessities) {
    if (!isNecessityActiveToday(necessity, dayOfWeek)) continue;
    const id = sessionCheckKey('nec', necessity.id);
    if (cleared.has(id)) continue;
    if (seen(necessity.title)) continue;
    remember(necessity.title);
    out.push({
      id,
      title: necessity.title,
      checked: input.sessionChecks[id] === true,
      kind: 'necessity',
      persistKind: 'session',
      necessityId: necessity.id,
    });
  }

  for (const weather of input.weatherItems) {
    if (input.dismissedWeather.includes(weather.id)) continue;
    const id = sessionCheckKey('wx', weather.id);
    if (cleared.has(id)) continue;
    if (seen(weather.title)) continue;
    remember(weather.title);
    out.push({
      id,
      title: weather.title,
      checked: input.sessionChecks[id] === true,
      kind: 'weather',
      persistKind: 'session',
      weatherId: weather.id,
      badge: weather.badge,
      badgeIcon: weather.badgeIcon,
    });
  }

  const packingItems = input.packingItems ?? [];
  for (const packing of packingItems) {
    if (seen(packing.title)) continue;
    remember(packing.title);
    out.push({
      id: packingBoardId(packing.id),
      title: packing.title,
      checked: packing.checked,
      kind: 'packing',
      persistKind: 'packing',
      packingItemId: packing.id,
      tripId: packing.tripId,
    });
  }

  if (input.context) {
    const extras = input.tripReminders.filter((item) => {
      if (item.layer === 'suggestion') return true;
      if (item.layer !== 'thisTrip') return false;
      return packingItems.length === 0;
    });
    for (const reminder of extras) {
      if (seen(reminder.title)) continue;
      const weatherId = reminder.source === 'weather' ? weatherKey(reminder.title) : undefined;
      if (weatherId && input.dismissedWeather.includes(weatherId)) continue;
      remember(reminder.title);
      out.push({
        id: reminder.id,
        title: reminder.title,
        checked: reminder.status === 'done',
        kind: reminder.source === 'weather' ? 'weather' : 'reminder',
        persistKind: 'reminder',
        reminderId: reminder.id,
        weatherId,
        badge: weatherBadgeForText(reminder.title, reminder.reason, reminder.source),
        badgeIcon: weatherBadgeIconForText(reminder.title, reminder.reason, reminder.source),
      });
    }
  }

  return out;
}

export function boardHasTitle(items: DepartureBoardItem[], title: string): boolean {
  return items.some((item) => titlesMatch(item.title, title));
}
