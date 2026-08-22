import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { aiClient } from '@/lib/ai/ai-client';
import { buildAIContext } from '@/lib/ai/ai-context';
import { missingPacking, suggestPackingForTrip } from '@/lib/ai/ai-packing';
import { runChatTurn } from '@/lib/ai/chat-service';
import { ChatSession } from '@/lib/ai/chat-session';
import { protectNecessitiesFromPacking, validateToolCall } from '@/lib/ai/ai-tools';
import { buildConstellation } from '@/lib/ai/constellation';
import { littleGuyWhisper, moodFromSituation } from '@/lib/ai/little-guy-mood';
import type { AIMessage, AIToolCall, CompactWeather, ConstellationPixel, LittleGuyMood } from '@/lib/ai/types';
import { weatherService } from '@/lib/engines';
import { usePlaces } from '@/store/PlaceProvider';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';
import type { PackingCategory, PackingSuggestion, TravelIntentionType } from '@/types/trip';

type LittleGuyContextValue = {
  messages: AIMessage[];
  mood: LittleGuyMood;
  whisper: string | null;
  pixels: ConstellationPixel[];
  suggestions: PackingSuggestion[];
  busy: boolean;
  send: (text: string) => Promise<void>;
  addSuggestedItem: (title: string) => Promise<void>;
};

const LittleGuyContext = createContext<LittleGuyContextValue | null>(null);

function asCategory(value: unknown): PackingCategory {
  const allowed: PackingCategory[] = [
    'documents',
    'essentials',
    'clothing',
    'toiletries',
    'health',
    'electronics',
    'activity',
    'other',
  ];
  return allowed.includes(value as PackingCategory) ? (value as PackingCategory) : 'other';
}

export function LittleGuyProvider({ children }: { children: ReactNode }) {
  const reminders = useReminders();
  const trips = useTrips();
  const places = usePlaces();
  const [session] = useState(() => new ChatSession());
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justCreatedTrip, setJustCreatedTrip] = useState(false);
  const [suggestions, setSuggestions] = useState<PackingSuggestion[]>([]);
  const [weather, setWeather] = useState<CompactWeather | null>(null);

  const unfinishedPacking = useMemo(
    () =>
      trips.upcomingTrips.reduce((sum, trip) => {
        const progress = trips.packingProgress(trip.id);
        return sum + Math.max(0, progress.total - progress.packed);
      }, 0),
    [trips],
  );

  const pixels = useMemo(
    () =>
      buildConstellation({
        reminders: reminders.reminders,
        upcomingTrips: trips.upcomingTrips,
        unfinishedPacking,
      }),
    [reminders.reminders, trips.upcomingTrips, unfinishedPacking],
  );

  const whisper = useMemo(
    () =>
      littleGuyWhisper({
        reminders: reminders.reminders,
        upcomingTrips: trips.upcomingTrips,
        unfinishedPacking,
        weather,
      }),
    [reminders.reminders, trips.upcomingTrips, unfinishedPacking, weather],
  );

  const mood = useMemo(
    () =>
      moodFromSituation({
        processing: busy,
        justSaved,
        justCreatedTrip,
        reminders: reminders.reminders,
        upcomingTrips: trips.upcomingTrips,
        unfinishedPacking,
        weather,
      }),
    [busy, justSaved, justCreatedTrip, reminders.reminders, trips.upcomingTrips, unfinishedPacking, weather],
  );

  const snapshot = useCallback(() => {
    return buildAIContext({
      reminders: reminders.reminders,
      personalNecessities: reminders.personalNecessities,
      upcomingTrips: trips.upcomingTrips,
      packingItems: trips.packingItems,
      places: places.places,
      intentions: trips.intentions,
      context: reminders.context,
      weather,
      packingProgress: trips.packingProgress,
    });
  }, [places.places, reminders, trips, weather]);

  const execute = useCallback(
    async (call: AIToolCall): Promise<unknown> => {
      const protectedCall = protectNecessitiesFromPacking(call);
      const validated = protectedCall ?? validateToolCall(call);
      if (!validated.ok) return { error: validated.message };

      const args = validated.args;
      const tripByHint = (hint?: unknown) => {
        const text = typeof hint === 'string' ? hint.toLowerCase() : '';
        return (
          trips.upcomingTrips.find(
            (trip) =>
              trip.id === hint ||
              trip.destination.toLowerCase().includes(text) ||
              trip.title.toLowerCase().includes(text),
          ) ?? trips.upcomingTrips[0]
        );
      };

      switch (validated.name) {
        case 'createReminder': {
          const placeName = typeof args.placeName === 'string' ? args.placeName : undefined;
          const dueAt = typeof args.dueAt === 'string' ? args.dueAt : undefined;
          const title = String(args.title);
          if (args.category === 'onTheWayBack') {
            await reminders.addOnTheWayBack(title, placeName);
          } else if (args.category === 'beforeUgo') {
            await reminders.addAlways(title);
          } else {
            await reminders.addReminder({
              title,
              category: 'specific',
              dueAt: dueAt ?? null,
              location: placeName
                ? { placeName, latitude: null, longitude: null, radiusMeters: null }
                : null,
            });
          }
          setJustSaved(true);
          return { saved: true };
        }
        case 'updateReminder':
          await reminders.updateReminder(String(args.id), {
            title: typeof args.title === 'string' ? args.title : undefined,
            dueAt: typeof args.dueAt === 'string' ? args.dueAt : undefined,
          });
          return { updated: true };
        case 'completeReminder':
          await reminders.toggleReminder(String(args.id));
          return { completed: true };
        case 'deleteReminder':
          await reminders.deleteReminder(String(args.id));
          return { deleted: true };
        case 'createSavedPlace':
          await places.upsertPlace({ name: String(args.name), label: typeof args.label === 'string' ? args.label : null });
          setJustSaved(true);
          return { saved: true };
        case 'deleteSavedPlace':
          await places.deletePlace(String(args.id));
          return { deleted: true };
        case 'createTrip': {
          const trip = await trips.createTrip({
            title: String(args.title),
            destination: String(args.destination),
            startDate: typeof args.startDate === 'string' ? args.startDate : null,
            endDate: typeof args.endDate === 'string' ? args.endDate : null,
            activity: typeof args.activity === 'string' ? args.activity : null,
            accommodation: typeof args.accommodation === 'string' ? args.accommodation : null,
            transportation: typeof args.transportation === 'string' ? args.transportation : null,
          });
          setJustCreatedTrip(true);
          return trip;
        }
        case 'getTrip':
          return tripByHint(args.id ?? args.destination) ?? null;
        case 'getUpcomingTrips':
          return snapshot().trips;
        case 'getPackingList': {
          const trip = tripByHint(args.tripId ?? args.id);
          if (!trip) return { missing: [], packed: 0, total: 0 };
          const progress = trips.packingProgress(trip.id);
          return {
            missing: missingPacking(trips.packingItems, trip.id).map((item) => item.title),
            packed: progress.packed,
            total: progress.total,
          };
        }
        case 'addPackingItem': {
          const trip = tripByHint(args.tripId);
          if (!trip) return { error: 'which trip?' };
          await trips.addPackingItem(trip.id, String(args.title), asCategory(args.category));
          setJustSaved(true);
          return { saved: true };
        }
        case 'removePackingItem':
          await trips.deletePackingItem(String(args.id));
          return { deleted: true };
        case 'suggestPacking': {
          const trip = tripByHint(args.tripId ?? args.id ?? args.destination);
          if (!trip) return [];
          let live = null;
          if (trip.latitude != null && trip.longitude != null) {
            live = await weatherService.getSnapshot({ latitude: trip.latitude, longitude: trip.longitude });
            if (live) {
              setWeather({
                summary: live.summary,
                rainLikely: live.rainLikely,
                temperatureC: live.temperatureC,
              });
            }
          }
          const next = suggestPackingForTrip({
            trip,
            personalNecessities: reminders.personalNecessities,
            packingItems: trips.packingItems,
            weather: live,
          });
          setSuggestions(next);
          return next;
        }
        case 'getPersonalNecessities':
          return reminders.personalNecessities.map((item) => item.title);
        case 'addPersonalNecessity':
          await reminders.addAlways(String(args.title));
          setJustSaved(true);
          return { saved: true };
        case 'addIntention': {
          const trip = tripByHint(args.tripId);
          if (!trip) return { error: 'which trip should hold this?' };
          await trips.addIntention({
            tripId: trip.id,
            title: String(args.title),
            type: (['food', 'place', 'activity', 'other'].includes(String(args.type))
              ? args.type
              : 'other') as TravelIntentionType,
            placeName: typeof args.placeName === 'string' ? args.placeName : undefined,
            note: typeof args.note === 'string' ? args.note : undefined,
          });
          setJustSaved(true);
          return { saved: true };
        }
        case 'getTodayContext':
          return snapshot().reminders;
        case 'getUpcomingContext': {
          const current = snapshot();
          return { trips: current.trips, places: current.places, intentions: current.intentions };
        }
        case 'getWeather':
          return weather;
        default:
          return null;
      }
    },
    [places, reminders, snapshot, trips, weather],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setMessages([...session.visible(), { role: 'user', content: trimmed }]);
      setBusy(true);
      setJustSaved(false);
      setJustCreatedTrip(false);
      try {
        const turn = await runChatTurn({
          provider: aiClient,
          history: session.all(),
          userText: trimmed,
          context: snapshot(),
          execute,
        });
        session.replace(turn.messages);
        setMessages(session.visible());
      } catch {
        const next = [
          ...session.visible(),
          { role: 'user' as const, content: trimmed },
          { role: 'assistant' as const, content: "hmm, i can't reach my little brain right now ♡" },
        ];
        session.replace(next);
        setMessages(session.visible());
      } finally {
        setBusy(false);
      }
    },
    [busy, execute, session, snapshot],
  );

  const addSuggestedItem = useCallback(
    async (title: string) => {
      const trip = trips.upcomingTrips[0];
      if (!trip) return;
      await trips.addPackingItem(trip.id, title, 'other');
      setSuggestions((current) => current.filter((item) => item.title !== title));
      setJustSaved(true);
    },
    [trips],
  );

  const value = useMemo(
    () => ({ messages, mood, whisper, pixels, suggestions, busy, send, addSuggestedItem }),
    [addSuggestedItem, busy, messages, mood, pixels, send, suggestions, whisper],
  );

  return <LittleGuyContext.Provider value={value}>{children}</LittleGuyContext.Provider>;
}

export function useLittleGuy(): LittleGuyContextValue {
  const ctx = useContext(LittleGuyContext);
  if (!ctx) throw new Error('useLittleGuy must be used within LittleGuyProvider');
  return ctx;
}
