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
import { FallbackAIProvider } from '@/lib/ai/fallback-provider';
import { creationResult } from '@/lib/ai/tool-result';
import { protectNecessitiesFromPacking, validateToolCall } from '@/lib/ai/ai-tools';
import { buildConstellation } from '@/lib/ai/constellation';
import { littleGuyWhisper, moodFromSituation } from '@/lib/ai/little-guy-mood';
import { isDepartingTrip } from '@/lib/home/departing-trips';
import { todayIso } from '@/lib/trips/dates';
import {
  resolveIntentionId,
  resolvePackingItemId,
  resolvePlaceId,
  resolveReminderId,
  resolveTripId,
} from '@/lib/ai/resolve-entity';
import type { AIMessage, AIToolCall, CompactWeather, ConstellationPixel, LittleGuyMood } from '@/lib/ai/types';
import { weatherService } from '@/lib/engines';
import { usePlaces } from '@/store/PlaceProvider';
import { usePreferences } from '@/store/PreferencesProvider';
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
const localAIClient = new FallbackAIProvider();

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
  const { preferences } = usePreferences();
  const [session] = useState(() => new ChatSession());
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justCreatedTrip, setJustCreatedTrip] = useState(false);
  const [suggestions, setSuggestions] = useState<PackingSuggestion[]>([]);
  const [weather, setWeather] = useState<CompactWeather | null>(null);
  const today = todayIso();

  const unfinishedPacking = useMemo(
    () =>
      trips.upcomingTrips.reduce((sum, trip) => {
        const progress = trips.packingProgress(trip.id);
        return sum + Math.max(0, progress.total - progress.packed);
      }, 0),
    [trips],
  );

  const pixels = useMemo(() => {
    const today = todayIso();
    return buildConstellation({
      reminders: reminders.reminders,
      necessities: reminders.personalNecessities,
      sessionChecks: reminders.departureSession.checks,
      sessionCleared: reminders.departureSession.cleared,
      packingItems: trips.packingItems,
      trips: trips.trips,
      today,
      departureActive:
        Boolean(reminders.context) || trips.trips.some((trip) => isDepartingTrip(trip, today)),
    });
  }, [
    reminders.context,
    reminders.departureSession.checks,
    reminders.departureSession.cleared,
    reminders.personalNecessities,
    reminders.reminders,
    trips.packingItems,
    trips.trips,
  ]);

  const whisper = useMemo(
    () =>
      littleGuyWhisper({
        reminders: reminders.reminders,
        upcomingTrips: trips.upcomingTrips,
        unfinishedPacking,
        today,
        weather,
      }),
    [reminders.reminders, trips.upcomingTrips, unfinishedPacking, today, weather],
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
        today,
        weather,
      }),
    [busy, justSaved, justCreatedTrip, reminders.reminders, trips.upcomingTrips, unfinishedPacking, today, weather],
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
      const ctx = snapshot();
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
          return creationResult(title);
        }
        case 'updateReminder': {
          const id = resolveReminderId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'i need to know which reminder you mean.' };
          await reminders.updateReminder(id, {
            title: typeof args.title === 'string' ? args.title : undefined,
            dueAt: typeof args.dueAt === 'string' ? args.dueAt : undefined,
          });
          return { success: true, updatedCount: 1 };
        }
        case 'completeReminder': {
          const id = resolveReminderId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'i need to know which reminder you mean.' };
          const existed = reminders.reminders.some((item) => item.id === id);
          if (!existed) return { success: false, updatedCount: 0, error: 'i need to know which reminder you mean.' };
          await reminders.toggleReminder(id);
          return { success: true, updatedCount: 1 };
        }
        case 'completeAllReminders': {
          const open = reminders.reminders.filter((item) => item.status === 'open');
          for (const item of open) {
            await reminders.toggleReminder(item.id);
          }
          return {
            success: open.length > 0,
            completedCount: open.length,
            deletedCount: open.length,
            completed: open.length,
          };
        }
        case 'deleteReminder': {
          const id = resolveReminderId(ctx, args);
          if (!id) return { success: false, deletedCount: 0, error: 'i need to know which reminder you mean.' };
          const existed = reminders.reminders.some((item) => item.id === id);
          if (!existed) return { success: false, deletedCount: 0 };
          await reminders.deleteReminder(id);
          return { success: true, deletedCount: 1 };
        }
        case 'createSavedPlace': {
          const place = await places.upsertPlace({
            name: String(args.name),
            label: typeof args.label === 'string' ? args.label : null,
          });
          if (!place) return { success: false, error: "i couldn't confirm that place was saved." };
          setJustSaved(true);
          return creationResult(place.label ?? place.name);
        }
        case 'updateSavedPlace': {
          const id = resolvePlaceId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'which saved place?' };
          await places.updatePlace(id, {
            name: typeof args.name === 'string' ? args.name : undefined,
            label: typeof args.label === 'string' ? args.label : undefined,
          });
          return { success: true, updatedCount: 1 };
        }
        case 'deleteSavedPlace': {
          const id = resolvePlaceId(ctx, args);
          if (!id) return { success: false, deletedCount: 0, error: 'which saved place?' };
          const existed = places.places.some((place) => place.id === id);
          if (!existed) return { success: false, deletedCount: 0 };
          await places.deletePlace(id);
          return { success: true, deletedCount: 1 };
        }
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
          if (!trip) return { success: false, error: "i couldn't confirm that trip was saved." };
          setJustCreatedTrip(true);
          return creationResult(trip.destination);
        }
        case 'updateTrip': {
          const id = resolveTripId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'which trip?' };
          const current = trips.upcomingTrips.find((trip) => trip.id === id) ?? trips.trips.find((trip) => trip.id === id);
          if (!current) return { success: false, updatedCount: 0, error: 'which trip?' };
          await trips.updateTrip(id, {
            title: typeof args.title === 'string' ? args.title : current.title,
            destination: typeof args.destination === 'string' ? args.destination : current.destination,
            startDate: typeof args.startDate === 'string' ? args.startDate : current.startDate,
            endDate: typeof args.endDate === 'string' ? args.endDate : current.endDate,
            durationDays: current.durationDays,
            activity: current.activity,
            accommodation: current.accommodation,
            transportation: current.transportation,
            latitude: current.latitude,
            longitude: current.longitude,
            timezone: current.timezone,
            country: current.country,
            region: current.region,
          });
          return { success: true, updatedCount: 1 };
        }
        case 'deleteTrip': {
          const id = resolveTripId(ctx, args);
          if (!id) return { success: false, deletedCount: 0, error: 'which trip?' };
          const existed = trips.trips.some((trip) => trip.id === id);
          if (!existed) return { success: false, deletedCount: 0 };
          await trips.deleteTrip(id);
          return { success: true, deletedCount: 1 };
        }
        case 'getTrip':
          return tripByHint(args.id ?? args.destination) ?? null;
        case 'getUpcomingTrips':
          return snapshot().trips;
        case 'getPackingList': {
          const trip = tripByHint(args.tripId ?? args.id ?? args.destination);
          if (!trip) return { missing: [], packed: 0, total: 0 };
          const progress = trips.packingProgress(trip.id);
          return {
            missing: missingPacking(trips.packingItems, trip.id).map((item) => item.title),
            packed: progress.packed,
            total: progress.total,
          };
        }
        case 'addPackingItem': {
          const trip = tripByHint(args.tripId ?? args.destination);
          if (!trip) return { error: 'which trip?' };
          await trips.addPackingItem(trip.id, String(args.title), asCategory(args.category));
          setJustSaved(true);
          return creationResult(String(args.title));
        }
        case 'removePackingItem': {
          const id = resolvePackingItemId(ctx, args);
          if (!id) return { success: false, deletedCount: 0, error: 'which packing item should i remove?' };
          const existed = trips.packingItems.some((item) => item.id === id);
          if (!existed) return { success: false, deletedCount: 0 };
          await trips.deletePackingItem(id);
          return { success: true, deletedCount: 1 };
        }
        case 'togglePackingItem': {
          const id = resolvePackingItemId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'which packing item?' };
          const existed = trips.packingItems.some((item) => item.id === id);
          if (!existed) return { success: false, updatedCount: 0, error: 'which packing item?' };
          await trips.togglePackingItem(id);
          return { success: true, updatedCount: 1, toggled: true };
        }
        case 'toggleAllPackingItems': {
          const tripId = resolveTripId(ctx, args);
          const targets = ctx.packing.filter(
            (item) => !item.checked && (!tripId || item.tripId === tripId),
          );
          for (const item of targets) {
            await trips.togglePackingItem(item.id);
          }
          return { success: targets.length > 0, updatedCount: targets.length, toggled: targets.length };
        }
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
          return creationResult(String(args.title));
        case 'addIntention': {
          const trip = tripByHint(args.tripId ?? args.destination);
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
          return creationResult(String(args.title));
        }
        case 'updateIntention': {
          const id = resolveIntentionId(ctx, args);
          if (!id) return { success: false, updatedCount: 0, error: 'which plan or intention?' };
          await trips.updateIntention(id, {
            title: typeof args.title === 'string' ? args.title : undefined,
            type: (['food', 'place', 'activity', 'other'].includes(String(args.type))
              ? args.type
              : undefined) as TravelIntentionType | undefined,
            placeName: typeof args.placeName === 'string' ? args.placeName : undefined,
            note: typeof args.note === 'string' ? args.note : undefined,
          });
          return { success: true, updatedCount: 1 };
        }
        case 'deleteIntention': {
          const id = resolveIntentionId(ctx, args);
          if (!id) return { success: false, deletedCount: 0, error: 'which plan or intention?' };
          const existed = trips.intentions.some((item) => item.id === id);
          if (!existed) return { success: false, deletedCount: 0 };
          await trips.deleteIntention(id);
          return { success: true, deletedCount: 1 };
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
          // Keep messages and the context snapshot on-device unless the user
          // has explicitly enabled cloud AI parsing.
          provider: preferences.privacy.aiParsingEnabled ? aiClient : localAIClient,
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
    [busy, execute, preferences.privacy.aiParsingEnabled, session, snapshot],
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
