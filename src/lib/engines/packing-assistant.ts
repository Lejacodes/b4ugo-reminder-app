/**
 * Local packing rules. Not weather, not a model, not travel APIs.
 * Replace this class later; keep the PackingAssistant interface.
 */
import type { PackingAssistant, TripContext } from './trip-contracts';
import type { WeatherSnapshot } from './contracts';
import { inferSeason } from '@/lib/trips/dates';
import type { PackingCategory, PackingSuggestion } from '@/types/trip';

function haystack(trip: TripContext): string {
  return [
    trip.title,
    trip.destination,
    trip.activity,
    trip.season,
    trip.accommodation,
    trip.transportation,
    trip.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export class LocalPackingAssistant implements PackingAssistant {
  generate(input: {
    trip: TripContext;
    personalNecessities: string[];
    existingTitles: string[];
    weather: WeatherSnapshot | null;
  }): PackingSuggestion[] {
    const { trip, personalNecessities, existingTitles, weather } = input;
    const text = haystack(trip);
    const taken = new Set(existingTitles.map((title) => title.trim().toLowerCase()));
    const out: PackingSuggestion[] = [];

    const add = (title: string, category: PackingCategory, reason: string) => {
      const key = title.trim().toLowerCase();
      if (!key || taken.has(key)) return;
      taken.add(key);
      out.push({ title, category, reason });
    };

    for (const title of personalNecessities) {
      add(title, 'essentials', 'from your personal necessities');
    }

    const nights = trip.durationDays != null ? Math.max(1, trip.durationDays) : 1;
    const overnight = nights >= 1 && (trip.durationDays != null || Boolean(trip.startDate));
    const multiDay = nights >= 2;
    const longStay = nights >= 5;
    const season = (trip.season ?? inferSeason(trip.startDate) ?? '').toLowerCase();

    const flying = /plane|flight|airport|fly/.test(text);
    const international = /passport|international|abroad|thailand|japan|europe|visa/.test(text);
    const camping = /camp|tent|hiking|hike/.test(text);
    const beach = /beach|sea|swim|snorkel/.test(text);
    const sleepover = /sleepover|overnight at/.test(text);
    const business = /business|work|meeting|conference/.test(text);
    const university = /univers|college|campus/.test(text);
    const hotel = /hotel|hostel|airbnb|resort/.test(text);
    const hot = /hot|summer|tropical|humid/.test(text) || season === 'summer';
    const cold = /cold|winter|snow/.test(text) || season === 'winter';

    if (flying || international || longStay) {
      add('Passport', 'documents', 'from destination / travel context');
      add('Travel documents', 'documents', 'from travel context');
      add('ID', 'documents', 'from travel context');
    }

    if (business || university) {
      add('ID', 'documents', 'from activity');
    }

    if (overnight || multiDay) {
      add('Underwear', 'clothing', `enough for ${nights} day${nights === 1 ? '' : 's'}`);
      add('T-shirts', 'clothing', `enough for ${nights} day${nights === 1 ? '' : 's'}`);
      add('Comfortable shoes', 'clothing', 'from trip length');
      add('Toothbrush', 'toiletries', 'overnight stay');
      add('Toiletries', 'toiletries', 'overnight stay');
      add('Personal medication', 'health', 'overnight stay');
    }

    if (hotel) {
      add('Phone charger', 'electronics', 'from accommodation');
    }

    if (flying) {
      add('Headphones', 'electronics', 'from transportation');
    }

    if (international) {
      add('Adapter', 'electronics', 'from international travel context');
    }

    if (hot) {
      add('Light clothing', 'clothing', 'from season / climate notes');
      add('Sunscreen', 'health', 'from season / climate notes');
    }

    if (cold) {
      add('Warm layer', 'clothing', 'from season / climate notes');
      add('Jacket', 'clothing', 'from season / climate notes');
    }

    if (camping) {
      add('Tent', 'activity', 'from camping context');
      add('Sleeping bag', 'activity', 'from camping context');
      add('Headlamp', 'activity', 'from camping context');
      add('Water bottle', 'essentials', 'from camping context');
    }

    if (beach) {
      add('Towel', 'activity', 'from beach context');
      add('Swimwear', 'clothing', 'from beach context');
      add('Sunscreen', 'health', 'from beach context');
    }

    if (sleepover) {
      add('Pajamas', 'clothing', 'from sleepover context');
    }

    if (business) {
      add('Laptop', 'electronics', 'from activity');
      add('Notebook', 'activity', 'from activity');
    }

    if (university) {
      add('Laptop', 'electronics', 'from activity');
      add('Notebook', 'activity', 'from activity');
    }

    if (weather?.isLive && weather.rainLikely) {
      add('Umbrella', 'other', 'rain expected');
    }

    if (weather?.isLive && weather.temperatureC != null && weather.temperatureC <= 12) {
      add('Jacket', 'clothing', 'cool temperatures');
    }

    if (weather?.isLive && weather.temperatureC != null && weather.temperatureC >= 28) {
      add('Water bottle', 'essentials', 'hot weather');
      add('Sunscreen', 'health', 'hot weather');
    }

    return out;
  }
}

export const packingAssistant = new LocalPackingAssistant();
