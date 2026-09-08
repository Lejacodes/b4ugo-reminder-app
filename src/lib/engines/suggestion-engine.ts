/**
 * Keyword packs for "for this trip".
 *
 * This is a local rule table, not a model. It only runs AFTER the user
 * names a destination/purpose. It never invents a destination on its own.
 */
import { weatherInjections } from '@/lib/context/weather-injections';
import type { BeforeUgoContext } from '@/types/reminder';
import type { SuggestionEngine, SuggestionItem, TripPackItem, WeatherSnapshot } from './contracts';

type Pack = {
  match: RegExp;
  items: TripPackItem[];
};

const TRIP_PACKS: Pack[] = [
  {
    match: /univers|college|campus|class|school|lecture|seminar/,
    items: [
      { title: 'Laptop' },
      { title: 'Notebook' },
      { title: 'Student ID' },
      { title: 'Water bottle' },
    ],
  },
  {
    match: /gym|workout|fitness|yoga/,
    items: [
      { title: 'Gym clothes' },
      { title: 'Sneakers' },
      { title: 'Water bottle' },
    ],
  },
  {
    match: /airport|flight|plane|travel/,
    items: [
      { title: 'Passport' },
      { title: 'Boarding pass' },
      { title: 'Charger' },
      { title: 'Headphones' },
    ],
  },
  {
    match: /beach|sea|swim/,
    items: [
      { title: 'Towel' },
      { title: 'Sunscreen' },
      { title: 'Water bottle' },
    ],
  },
  {
    match: /work|office|meeting/,
    items: [{ title: 'Laptop' }, { title: 'Charger' }, { title: 'Notebook' }],
  },
];

function haystack(context: BeforeUgoContext): string {
  return `${context.destination} ${context.purpose ?? ''}`.toLowerCase();
}

export class LocalSuggestionEngine implements SuggestionEngine {
  getTripPack(context: BeforeUgoContext): TripPackItem[] {
    const text = haystack(context);
    const pack = TRIP_PACKS.find((entry) => entry.match.test(text));
    return pack ? pack.items.map((item) => ({ ...item })) : [];
  }

  getSuggestions(
    context: BeforeUgoContext,
    weather: WeatherSnapshot | null,
    existingTitles: string[],
  ): SuggestionItem[] {
    const taken = new Set(existingTitles.map((title) => title.trim().toLowerCase()));
    const out: SuggestionItem[] = [];
    const add = (item: SuggestionItem) => {
      if (taken.has(item.title.trim().toLowerCase())) return;
      taken.add(item.title.trim().toLowerCase());
      out.push(item);
    };

    for (const injection of weatherInjections(weather)) {
      add({
        title: injection.title,
        reason: injection.reason,
        source: 'weather',
      });
    }

    const text = haystack(context);
    if (/class|lecture|univers|work|office/.test(text)) {
      add({
        title: 'Charger',
        reason: "you might be staying late",
        source: 'rule',
      });
    }

    return out;
  }
}

export const suggestionEngine = new LocalSuggestionEngine();
