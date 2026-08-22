import { todayIso } from '@/lib/trips/dates';
import type { Place } from '@/types/place';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';
import type { PackingItem, TravelIntention, Trip } from '@/types/trip';

import type { AIContextSnapshot, CompactWeather } from './types';

const MAX_REMINDERS = 20;
const MAX_TRIPS = 6;
const MAX_PLACES = 12;
const MAX_INTENTIONS = 16;

export function buildAIContext(input: {
  reminders: Reminder[];
  personalNecessities: PersonalNecessity[];
  upcomingTrips: Trip[];
  packingItems: PackingItem[];
  places: Place[];
  intentions?: TravelIntention[];
  context: BeforeUgoContext | null;
  weather?: CompactWeather | null;
  packingProgress?: (tripId: string) => { packed: number; total: number };
}): AIContextSnapshot {
  const open = input.reminders.filter((item) => item.status === 'open').slice(0, MAX_REMINDERS);
  return {
    today: todayIso(),
    reminders: open.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      status: item.status,
      place: item.location?.placeName ?? null,
      dueAt: item.dueAt,
    })),
    necessities: input.personalNecessities.map((item) => item.title).slice(0, 20),
    trips: input.upcomingTrips.slice(0, MAX_TRIPS).map((trip) => {
      const progress = input.packingProgress?.(trip.id) ?? { packed: 0, total: 0 };
      return {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        durationDays: trip.durationDays,
        activity: trip.activity,
        packed: progress.packed,
        total: progress.total,
      };
    }),
    places: input.places
      .filter((place) => place.type !== 'home')
      .slice(0, MAX_PLACES)
      .map((place) => ({ id: place.id, name: place.name, type: place.type })),
    intentions: (input.intentions ?? []).slice(0, MAX_INTENTIONS).map((item) => ({
      id: item.id,
      tripId: item.tripId,
      title: item.title,
      type: item.type,
      placeName: item.placeName,
    })),
    weather: input.weather ?? null,
    activeDestination: input.context?.destination ?? null,
  };
}
