import { interpretLocally } from '@/lib/ai/fallback-provider';
import { isGenericPlaceName } from '@/lib/ai/ai-tools';
import type { AIContextSnapshot, CompactPlace } from '@/lib/ai/types';
import { todayIso } from '@/lib/trips/dates';

export type SmartAddTarget = 'beforeILeave' | 'onTheWayBack' | 'trip';

export type SmartAddClassification = {
  target: SmartAddTarget;
  title: string;
  placeName: string | null;
  source: 'llm' | 'heuristic';
};

const PLACE_CUE =
  /\b(?:when i(?:['’]m| am) near|near|from|at|by)\s+(?:the\s+)?(.+)$/i;
const STORE_CUE =
  /\b(migros|petzone|carrefour|tesco|walmart|supermarket|pharmacy|grocery|market|mall|store|shop|bakery|chemist)\b/i;
const TRIP_CUE = /\b(pack|suitcase|airport|flight|boarding|luggage|passport)\b/i;
const LEAD_IN = /^(?:remind me to|don't forget to|dont forget to|can you remind me to|remember to|i need to|i have to)\s+/i;

function emptyContext(places: CompactPlace[]): AIContextSnapshot {
  return {
    today: todayIso(),
    reminders: [],
    necessities: [],
    trips: [],
    places,
    intentions: [],
    packing: [],
    weather: null,
    activeDestination: null,
  };
}

function tidyTitle(raw: string): string {
  return raw.replace(LEAD_IN, '').replace(/\s+/g, ' ').trim();
}

function extractPlace(text: string, places: CompactPlace[]): string | null {
  const cue = PLACE_CUE.exec(text.trim());
  if (cue?.[1]) {
    const named = cue[1].replace(/[.!?]+$/, '').trim();
    if (named && !isGenericPlaceName(named) && !isGenericPlaceName(`the ${named}`)) {
      return named;
    }
  }

  const lower = text.toLowerCase();
  const saved = places.find((place) => lower.includes(place.name.toLowerCase()));
  if (saved) return saved.name;

  const store = STORE_CUE.exec(text);
  if (store?.[1] && !isGenericPlaceName(store[1])) return store[1];
  return null;
}

function heuristicTarget(
  text: string,
  options: { hasTripContext: boolean; placeName: string | null },
): SmartAddTarget {
  if (options.placeName || PLACE_CUE.test(text) || STORE_CUE.test(text)) {
    return 'onTheWayBack';
  }
  if (TRIP_CUE.test(text) && options.hasTripContext) return 'trip';
  return 'beforeILeave';
}

/**
 * Classify a free-form capture line for the unified Add chips.
 * Uses the existing local interpreter first, then place / trip heuristics.
 */
export function classifySmartAdd(
  text: string,
  options: { hasTripContext: boolean; places?: CompactPlace[] } = { hasTripContext: false },
): SmartAddClassification {
  const places = options.places ?? [];
  const cleaned = tidyTitle(text);
  if (!cleaned) {
    return {
      target: options.hasTripContext && TRIP_CUE.test(cleaned) ? 'trip' : 'beforeILeave',
      title: '',
      placeName: null,
      source: 'heuristic',
    };
  }

  const local = interpretLocally(text.trim(), emptyContext(places));
  const created = local.toolCalls.find((call) => call.name === 'createReminder');
  if (created) {
    const category = typeof created.args.category === 'string' ? created.args.category : null;
    const placeName =
      typeof created.args.placeName === 'string' && created.args.placeName.trim()
        ? created.args.placeName.trim()
        : extractPlace(text, places);
    const title =
      typeof created.args.title === 'string' && created.args.title.trim()
        ? created.args.title.trim()
        : cleaned;
    if (category === 'onTheWayBack' || placeName) {
      return { target: 'onTheWayBack', title, placeName, source: 'llm' };
    }
    if (category === 'beforeUgo') {
      return {
        target: TRIP_CUE.test(text) && options.hasTripContext ? 'trip' : 'beforeILeave',
        title,
        placeName: null,
        source: 'llm',
      };
    }
    return {
      target: heuristicTarget(text, { hasTripContext: options.hasTripContext, placeName }),
      title,
      placeName,
      source: 'llm',
    };
  }

  const packing = local.toolCalls.find(
    (call) => call.name === 'addPackingItem' || call.name === 'createTrip',
  );
  if (packing && options.hasTripContext) {
    return { target: 'trip', title: cleaned, placeName: null, source: 'llm' };
  }

  const placeName = extractPlace(text, places);
  const title = placeName
    ? tidyTitle(cleaned.replace(PLACE_CUE, '').replace(/[.,\s]+$/, ''))
    : cleaned;

  return {
    target: heuristicTarget(text, { hasTripContext: options.hasTripContext, placeName }),
    title: title || cleaned,
    placeName,
    source: 'heuristic',
  };
}
