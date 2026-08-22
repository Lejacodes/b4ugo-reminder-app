import { packingAssistant } from '@/lib/engines';
import type { WeatherSnapshot } from '@/lib/engines/contracts';
import type { PersonalNecessity } from '@/types/reminder';
import type { PackingItem, PackingSuggestion, Trip } from '@/types/trip';

export function suggestPackingForTrip(input: {
  trip: Trip;
  personalNecessities: PersonalNecessity[];
  packingItems: PackingItem[];
  weather: WeatherSnapshot | null;
}): PackingSuggestion[] {
  const existing = input.packingItems
    .filter((item) => item.tripId === input.trip.id && !item.dismissed)
    .map((item) => item.title);
  return packingAssistant.generate({
    trip: {
      title: input.trip.title,
      destination: input.trip.destination,
      durationDays: input.trip.durationDays,
      activity: input.trip.activity,
      season: input.trip.season,
      accommodation: input.trip.accommodation,
      transportation: input.trip.transportation,
      notes: input.trip.notes,
      startDate: input.trip.startDate,
    },
    personalNecessities: input.personalNecessities.map((item) => item.title),
    existingTitles: existing,
    weather: input.weather,
  });
}

export function missingPacking(items: PackingItem[], tripId: string): PackingItem[] {
  return items.filter((item) => item.tripId === tripId && !item.dismissed && !item.checked);
}
