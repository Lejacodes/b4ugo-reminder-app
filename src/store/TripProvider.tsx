import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { packingAssistant, weatherService } from '@/lib/engines';
import { geocodingService } from '@/lib/geocoding';
import { isPastTrip, isUpcomingTrip, resolveTripDates } from '@/lib/trips/dates';
import { STARTER_TEMPLATES } from '@/lib/trips/starter-templates';
import {
  loadPackingItems,
  loadPackingTemplates,
  loadTravelIntentions,
  loadTrips,
  savePackingItems,
  savePackingTemplates,
  saveTravelIntentions,
  saveTrips,
} from '@/lib/trips/trip-store';
import { useAuth } from '@/store/AuthProvider';
import { useRecordRevision } from '@/hooks/use-record-revision';
import { useAccountGuard } from '@/hooks/use-account-guard';
import { collectionChange, localRepository } from '@/lib/sync/local';
import { persisted, unchanged, type SaveResult } from '@/lib/storage/mutation-result';
import { useReminders } from '@/store/ReminderProvider';
import { createId, titlesMatch } from '@/types/reminder';
import type {
  PackingCategory,
  PackingItem,
  PackingSource,
  PackingTemplate,
  PackingTemplateItem,
  TravelIntention,
  TravelIntentionType,
  Trip,
  TripDraft,
} from '@/types/trip';

function nowIso(): string {
  return new Date().toISOString();
}

async function buildTrip(draft: TripDraft): Promise<Trip> {
  const stamp = nowIso();
  const dates = resolveTripDates({
    startDate: draft.startDate,
    endDate: draft.endDate,
    durationDays: draft.durationDays,
  });
  const geo =
    draft.latitude != null && draft.longitude != null
      ? {
          latitude: draft.latitude,
          longitude: draft.longitude,
          timezone: draft.timezone ?? null,
          country: draft.country ?? null,
          region: draft.region ?? null,
        }
      : await geocodingService.searchDestination(draft.destination.trim());
  return {
    id: createId('trip'),
    title: draft.title.trim(),
    destination: draft.destination.trim(),
    startDate: dates.startDate,
    endDate: dates.endDate,
    durationDays: dates.durationDays,
    activity: draft.activity?.trim() || null,
    season: draft.season?.trim() || null,
    accommodation: draft.accommodation?.trim() || null,
    transportation: draft.transportation?.trim() || null,
    notes: draft.notes?.trim() || null,
    status: 'planned',
    createdAt: stamp,
    updatedAt: stamp,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    timezone: geo?.timezone ?? null,
    country: geo?.country ?? null,
    region: geo?.region ?? null,
  };
}

function buildPackingItem(input: {
  tripId: string;
  title: string;
  category: PackingCategory;
  source: PackingSource;
  reason?: string | null;
}): PackingItem {
  const stamp = nowIso();
  return {
    id: createId('pack'),
    tripId: input.tripId,
    title: input.title.trim(),
    category: input.category,
    checked: false,
    source: input.source,
    reason: input.reason ?? null,
    dismissed: false,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function buildTemplate(name: string, items: PackingTemplateItem[]): PackingTemplate {
  const stamp = nowIso();
  return {
    id: createId('tpl'),
    name: name.trim(),
    items: items.map((item) => ({ title: item.title.trim(), category: item.category })),
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function buildIntention(input: {
  tripId: string;
  title: string;
  type: TravelIntentionType;
  placeName?: string | null;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): TravelIntention {
  const stamp = nowIso();
  return {
    id: createId('int'),
    tripId: input.tripId,
    title: input.title.trim(),
    type: input.type,
    placeName: input.placeName?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    note: input.note?.trim() || null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

type TripContextValue = {
  trips: Trip[];
  packingItems: PackingItem[];
  templates: PackingTemplate[];
  intentions: TravelIntention[];
  isLoading: boolean;
  upcomingTrips: Trip[];
  pastTrips: Trip[];
  archivedTrips: Trip[];
  activeTrip: Trip | null;
  getTrip: (id: string) => Trip | undefined;
  packingFor: (tripId: string) => PackingItem[];
  packingProgress: (tripId: string) => { packed: number; total: number };
  intentionsFor: (tripId: string) => TravelIntention[];
  createTrip: (draft: TripDraft, options?: { templateId?: string; generate?: boolean }) => Promise<SaveResult<Trip> | null>;
  updateTrip: (id: string, draft: TripDraft, expected?: Trip) => Promise<void>;
  archiveTrip: (id: string) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  enterTravelMode: (id: string) => Promise<void>;
  togglePackingItem: (id: string) => Promise<void>;
  addPackingItem: (tripId: string, title: string, category: PackingCategory) => Promise<SaveResult<PackingItem>>;
  updatePackingItem: (
    id: string,
    patch: { title?: string; category?: PackingCategory },
  ) => Promise<void>;
  deletePackingItem: (id: string) => Promise<void>;
  dismissPackingItem: (id: string) => Promise<void>;
  regeneratePacking: (tripId: string) => Promise<void>;
  applyTemplate: (tripId: string, templateId: string) => Promise<void>;
  saveTripAsTemplate: (tripId: string, name: string) => Promise<void>;
  createTemplate: (name: string, items?: PackingTemplateItem[]) => Promise<void>;
  renameTemplate: (id: string, name: string) => Promise<void>;
  replaceTemplateItems: (id: string, items: PackingTemplateItem[]) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addIntention: (input: {
    tripId: string;
    title: string;
    type: TravelIntentionType;
    placeName?: string;
    note?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<SaveResult<TravelIntention>>;
  updateIntention: (
    id: string,
    patch: {
      title?: string;
      type?: TravelIntentionType;
      placeName?: string;
      note?: string;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) => Promise<void>;
  deleteIntention: (id: string) => Promise<void>;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { personalNecessities } = useReminders();
  const userId = user?.id ?? null;
  const recordRevision = useRecordRevision(userId);
  const assertAccount = useAccountGuard(userId);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [templates, setTemplates] = useState<PackingTemplate[]>([]);
  const [intentions, setIntentions] = useState<TravelIntention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tripsRef = useRef(trips);
  const packingRef = useRef(packingItems);
  const templatesRef = useRef(templates);
  const intentionsRef = useRef(intentions);
  const necessitiesRef = useRef(personalNecessities);

  useEffect(() => {
    tripsRef.current = trips;
    packingRef.current = packingItems;
    templatesRef.current = templates;
    intentionsRef.current = intentions;
    necessitiesRef.current = personalNecessities;
  }, [intentions, packingItems, personalNecessities, templates, trips]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status === 'restoring') {
        setIsLoading(true);
        return;
      }
      if (!userId) {
        setTrips([]);
        setPackingItems([]);
        setTemplates([]);
        setIntentions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [storedTrips, storedPacking, storedTemplates, storedIntentions] = await Promise.all([
          loadTrips(userId),
          loadPackingItems(userId),
          loadPackingTemplates(userId),
          loadTravelIntentions(userId),
        ]);
        if (cancelled) return;

        let nextTemplates = storedTemplates;
        if (nextTemplates.length === 0 && !(await localRepository.hasHistory(userId, 'packingTemplates'))) {
          nextTemplates = STARTER_TEMPLATES.map((entry) => buildTemplate(entry.name, entry.items));
          await savePackingTemplates(userId, nextTemplates);
        }

        setTrips(storedTrips);
        setPackingItems(storedPacking);
        setTemplates(nextTemplates);
        setIntentions(storedIntentions);
      } catch {
        if (!cancelled) {
          setTrips([]);
          setPackingItems([]);
          setTemplates([]);
          setIntentions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId, recordRevision]);

  const persistTrips = useCallback(
    async (next: Trip[]) => {
      assertAccount();
      if (userId) await saveTrips(userId, next, tripsRef.current);
      assertAccount();
      tripsRef.current = next;
      setTrips(next);
    },
    [userId, assertAccount],
  );

  const persistPacking = useCallback(
    async (next: PackingItem[]) => {
      assertAccount();
      if (userId) await savePackingItems(userId, next, packingRef.current);
      assertAccount();
      packingRef.current = next;
      setPackingItems(next);
    },
    [userId, assertAccount],
  );

  const persistTemplates = useCallback(
    async (next: PackingTemplate[]) => {
      assertAccount();
      if (userId) await savePackingTemplates(userId, next, templatesRef.current);
      assertAccount();
      templatesRef.current = next;
      setTemplates(next);
    },
    [userId, assertAccount],
  );

  const persistIntentions = useCallback(
    async (next: TravelIntention[]) => {
      assertAccount();
      if (userId) await saveTravelIntentions(userId, next, intentionsRef.current);
      assertAccount();
      intentionsRef.current = next;
      setIntentions(next);
    },
    [userId, assertAccount],
  );

  const mergeSuggestions = useCallback(
    async (trip: Trip, source: PackingSource, extra?: PackingTemplateItem[], commit = true) => {
      const current = packingRef.current;
      const forTrip = current.filter((item) => item.tripId === trip.id);
      const blocked = new Set(
        forTrip.map((item) => item.title.trim().toLowerCase()).filter(Boolean),
      );
      const added: PackingItem[] = [];

      if (extra) {
        for (const item of extra) {
          const key = item.title.trim().toLowerCase();
          if (!key || blocked.has(key)) continue;
          blocked.add(key);
          added.push(
            buildPackingItem({
              tripId: trip.id,
              title: item.title,
              category: item.category,
              source: 'template',
            }),
          );
        }
      }

      const weather =
        trip.latitude != null && trip.longitude != null
          ? await weatherService.getSnapshot({
              latitude: trip.latitude,
              longitude: trip.longitude,
            })
          : await weatherService.getSnapshot();
      const suggestions = packingAssistant.generate({
        trip,
        personalNecessities: necessitiesRef.current.map((item) => item.title),
        existingTitles: [...blocked],
        weather,
      });
      for (const item of suggestions) {
        const key = item.title.trim().toLowerCase();
        if (blocked.has(key)) continue;
        blocked.add(key);
        added.push(
          buildPackingItem({
            tripId: trip.id,
            title: item.title,
            category: item.category,
            source,
            reason: item.reason,
          }),
        );
      }

      if (commit && added.length > 0) await persistPacking([...current, ...added]);
      return added;
    },
    [persistPacking],
  );

  const createTrip = useCallback(
    async (draft: TripDraft, options?: { templateId?: string; generate?: boolean }) => {
      assertAccount();
      if (!draft.title.trim() || !draft.destination.trim()) return null;
      const trip = await buildTrip(draft);
      const existing = tripsRef.current.find((item) => titlesMatch(item.title, trip.title) &&
        titlesMatch(item.destination, trip.destination) && item.startDate === trip.startDate && item.endDate === trip.endDate);
      if (existing) return unchanged(existing);

      const template = options?.templateId
        ? templatesRef.current.find((item) => item.id === options.templateId)
        : undefined;
      const added = template || options?.generate !== false
        ? await mergeSuggestions(trip, 'generated', template?.items, false) : [];
      if (!userId) throw new Error('Sign in before saving a trip');
      const nextTrips = [...tripsRef.current, trip];
      const nextPacking = [...packingRef.current, ...added];
      assertAccount();
      await localRepository.write(userId, [collectionChange('trips', tripsRef.current, nextTrips),
        collectionChange('packingItems', packingRef.current, nextPacking)]);
      assertAccount();
      tripsRef.current = nextTrips; setTrips(nextTrips);
      packingRef.current = nextPacking; setPackingItems(nextPacking);
      return persisted(trip);
    },
    [mergeSuggestions, userId, assertAccount],
  );

  const updateTrip = useCallback(
    async (id: string, draft: TripDraft, expected?: Trip) => {
      const dates = resolveTripDates({
        startDate: draft.startDate,
        endDate: draft.endDate,
        durationDays: draft.durationDays,
      });
      const destination = draft.destination.trim();
      const current = tripsRef.current.find((trip) => trip.id === id);
      if (!current) throw new Error('This trip is no longer available');
      if (expected && JSON.stringify(current) !== JSON.stringify(expected)) throw new Error('This trip changed while you were editing');
      const geo =
        draft.latitude != null && draft.longitude != null
          ? {
              latitude: draft.latitude,
              longitude: draft.longitude,
              timezone: draft.timezone ?? null,
              country: draft.country ?? null,
              region: draft.region ?? null,
            }
          : destination && destination !== current?.destination
            ? await geocodingService.searchDestination(destination)
            : null;
      const next = tripsRef.current.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              title: draft.title.trim() || trip.title,
              destination: destination || trip.destination,
              startDate: dates.startDate,
              endDate: dates.endDate,
              durationDays: dates.durationDays,
              activity: draft.activity?.trim() || null,
              season: draft.season?.trim() || null,
              accommodation: draft.accommodation?.trim() || null,
              transportation: draft.transportation?.trim() || null,
              notes: draft.notes?.trim() || null,
              updatedAt: nowIso(),
              ...(geo
                ? {
                    latitude: geo.latitude,
                    longitude: geo.longitude,
                    timezone: geo.timezone,
                    country: geo.country,
                    region: geo.region,
                  }
                : {}),
            }
          : trip,
      );
      if (tripsRef.current.find((trip) => trip.id === id) !== current) throw new Error('This trip changed while you were editing');
      await persistTrips(next);
    },
    [persistTrips],
  );

  const archiveTrip = useCallback(
    async (id: string) => {
      const next = tripsRef.current.map((trip) =>
        trip.id === id ? { ...trip, status: 'archived' as const, updatedAt: nowIso() } : trip,
      );
      await persistTrips(next);
    },
    [persistTrips],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      if (!userId) throw new Error('Sign in before changing a trip');
      assertAccount();
      const nextTrips = tripsRef.current.filter((trip) => trip.id !== id);
      const nextPacking = packingRef.current.filter((item) => item.tripId !== id);
      const nextIntentions = intentionsRef.current.filter((item) => item.tripId !== id);
      await localRepository.write(userId, [
        collectionChange('packingItems', packingRef.current, nextPacking),
        collectionChange('travelIntentions', intentionsRef.current, nextIntentions),
        collectionChange('trips', tripsRef.current, nextTrips),
      ]);
      assertAccount();
      tripsRef.current = nextTrips; setTrips(nextTrips);
      packingRef.current = nextPacking; setPackingItems(nextPacking);
      intentionsRef.current = nextIntentions; setIntentions(nextIntentions);
    },
    [userId, assertAccount],
  );

  const enterTravelMode = useCallback(
    async (id: string) => {
      const next = tripsRef.current.map((trip) =>
        trip.id === id ? { ...trip, status: 'active' as const, updatedAt: nowIso() } : trip,
      );
      await persistTrips(next);
    },
    [persistTrips],
  );

  const togglePackingItem = useCallback(
    async (id: string) => {
      const next = packingRef.current.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked, updatedAt: nowIso() }
          : item,
      );
      await persistPacking(next);
    },
    [persistPacking],
  );

  const addPackingItem = useCallback(
    async (tripId: string, title: string, category: PackingCategory) => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error('A packing item needs a title');
      const existing = packingRef.current.find(
        (item) => item.tripId === tripId && !item.dismissed && titlesMatch(item.title, trimmed),
      );
      if (existing) return unchanged(existing);
      if (!tripsRef.current.some((trip) => trip.id === tripId)) throw new Error('This trip is unavailable');
      const entity = buildPackingItem({ tripId, title: trimmed, category, source: 'user' });
      await persistPacking([...packingRef.current, entity]);
      return persisted(entity);
    },
    [persistPacking],
  );

  const updatePackingItem = useCallback(
    async (id: string, patch: { title?: string; category?: PackingCategory }) => {
      const next = packingRef.current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: patch.title?.trim() || item.title,
              category: patch.category ?? item.category,
              updatedAt: nowIso(),
            }
          : item,
      );
      await persistPacking(next);
    },
    [persistPacking],
  );

  const deletePackingItem = useCallback(
    async (id: string) => {
      await persistPacking(packingRef.current.filter((item) => item.id !== id));
    },
    [persistPacking],
  );

  const dismissPackingItem = useCallback(
    async (id: string) => {
      const next = packingRef.current.map((item) =>
        item.id === id ? { ...item, dismissed: true, updatedAt: nowIso() } : item,
      );
      await persistPacking(next);
    },
    [persistPacking],
  );

  const regeneratePacking = useCallback(
    async (tripId: string) => {
      const trip = tripsRef.current.find((item) => item.id === tripId);
      if (!trip) return;
      await mergeSuggestions(trip, 'generated');
    },
    [mergeSuggestions],
  );

  const applyTemplate = useCallback(
    async (tripId: string, templateId: string) => {
      const trip = tripsRef.current.find((item) => item.id === tripId);
      const template = templatesRef.current.find((item) => item.id === templateId);
      if (!trip || !template) return;
      const current = packingRef.current;
      const blocked = new Set(
        current
          .filter((item) => item.tripId === tripId)
          .map((item) => item.title.trim().toLowerCase()),
      );
      const added = template.items
        .filter((item) => {
          const key = item.title.trim().toLowerCase();
          if (!key || blocked.has(key)) return false;
          blocked.add(key);
          return true;
        })
        .map((item) =>
          buildPackingItem({
            tripId,
            title: item.title,
            category: item.category,
            source: 'template',
          }),
        );
      if (added.length === 0) return;
      await persistPacking([...current, ...added]);
    },
    [persistPacking],
  );

  const saveTripAsTemplate = useCallback(
    async (tripId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const items = packingRef.current
        .filter((item) => item.tripId === tripId && !item.dismissed)
        .map((item) => ({ title: item.title, category: item.category }));
      const unique: PackingTemplateItem[] = [];
      for (const item of items) {
        if (unique.some((entry) => titlesMatch(entry.title, item.title))) continue;
        unique.push(item);
      }
      await persistTemplates([...templatesRef.current, buildTemplate(trimmed, unique)]);
    },
    [persistTemplates],
  );

  const createTemplate = useCallback(
    async (name: string, items: PackingTemplateItem[] = []) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      await persistTemplates([...templatesRef.current, buildTemplate(trimmed, items)]);
    },
    [persistTemplates],
  );

  const renameTemplate = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const next = templatesRef.current.map((item) =>
        item.id === id ? { ...item, name: trimmed, updatedAt: nowIso() } : item,
      );
      await persistTemplates(next);
    },
    [persistTemplates],
  );

  const replaceTemplateItems = useCallback(
    async (id: string, items: PackingTemplateItem[]) => {
      const next = templatesRef.current.map((item) =>
        item.id === id
          ? {
              ...item,
              items: items.map((entry) => ({
                title: entry.title.trim(),
                category: entry.category,
              })),
              updatedAt: nowIso(),
            }
          : item,
      );
      await persistTemplates(next);
    },
    [persistTemplates],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await persistTemplates(templatesRef.current.filter((item) => item.id !== id));
    },
    [persistTemplates],
  );

  const addIntention = useCallback(
    async (input: {
      tripId: string;
      title: string;
      type: TravelIntentionType;
      placeName?: string;
      note?: string;
      latitude?: number | null;
      longitude?: number | null;
    }) => {
      const trimmed = input.title.trim();
      if (!trimmed) throw new Error('A trip plan needs a title');
      const existing = intentionsRef.current.find((item) => item.tripId === input.tripId && titlesMatch(item.title, trimmed));
      if (existing) return unchanged(existing);
      if (!tripsRef.current.some((trip) => trip.id === input.tripId)) throw new Error('This trip is unavailable');
      const place = input.placeName?.trim();
      const geo =
        input.latitude != null && input.longitude != null
          ? { latitude: input.latitude, longitude: input.longitude }
          : place
            ? await geocodingService.searchDestination(place)
            : null;
      const entity = buildIntention({
          tripId: input.tripId,
          title: trimmed,
          type: input.type,
          placeName: place,
          note: input.note,
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
        });
      await persistIntentions([...intentionsRef.current, entity]);
      return persisted(entity);
    },
    [persistIntentions],
  );

  const updateIntention = useCallback(
    async (
      id: string,
      patch: {
        title?: string;
        type?: TravelIntentionType;
        placeName?: string;
        note?: string;
        latitude?: number | null;
        longitude?: number | null;
      },
    ) => {
      const current = intentionsRef.current.find((item) => item.id === id);
      const place = patch.placeName !== undefined ? patch.placeName.trim() : current?.placeName ?? '';
      const geo =
        patch.latitude != null && patch.longitude != null
          ? { latitude: patch.latitude, longitude: patch.longitude }
          : patch.placeName !== undefined && place && place !== current?.placeName
            ? await geocodingService.searchDestination(place)
            : null;
      const next = intentionsRef.current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: patch.title?.trim() || item.title,
              type: patch.type ?? item.type,
              placeName: patch.placeName !== undefined ? place || null : item.placeName,
              note: patch.note !== undefined ? patch.note.trim() || null : item.note,
              latitude: geo?.latitude ?? item.latitude,
              longitude: geo?.longitude ?? item.longitude,
              updatedAt: nowIso(),
            }
          : item,
      );
      await persistIntentions(next);
    },
    [persistIntentions],
  );

  const deleteIntention = useCallback(
    async (id: string) => {
      await persistIntentions(intentionsRef.current.filter((item) => item.id !== id));
    },
    [persistIntentions],
  );

  const upcomingTrips = useMemo(
    () =>
      trips
        .filter((trip) => trip.status !== 'archived' && isUpcomingTrip(trip.startDate, trip.endDate))
        .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '')),
    [trips],
  );

  const pastTrips = useMemo(
    () =>
      trips
        .filter((trip) => trip.status !== 'archived' && isPastTrip(trip.startDate, trip.endDate))
        .sort((a, b) => (b.endDate ?? b.startDate ?? '').localeCompare(a.endDate ?? a.startDate ?? '')),
    [trips],
  );

  const archivedTrips = useMemo(
    () => trips.filter((trip) => trip.status === 'archived'),
    [trips],
  );

  const activeTrip = upcomingTrips[0] ?? null;

  const getTrip = useCallback((id: string) => trips.find((trip) => trip.id === id), [trips]);

  const packingFor = useCallback(
    (tripId: string) =>
      packingItems.filter((item) => item.tripId === tripId && !item.dismissed),
    [packingItems],
  );

  const packingProgress = useCallback(
    (tripId: string) => {
      const items = packingItems.filter((item) => item.tripId === tripId && !item.dismissed);
      return {
        packed: items.filter((item) => item.checked).length,
        total: items.length,
      };
    },
    [packingItems],
  );

  const intentionsFor = useCallback(
    (tripId: string) => intentions.filter((item) => item.tripId === tripId),
    [intentions],
  );

  const value = useMemo<TripContextValue>(
    () => ({
      trips,
      packingItems,
      templates,
      intentions,
      isLoading,
      upcomingTrips,
      pastTrips,
      archivedTrips,
      activeTrip,
      getTrip,
      packingFor,
      packingProgress,
      intentionsFor,
      createTrip,
      updateTrip,
      archiveTrip,
      deleteTrip,
      enterTravelMode,
      togglePackingItem,
      addPackingItem,
      updatePackingItem,
      deletePackingItem,
      dismissPackingItem,
      regeneratePacking,
      applyTemplate,
      saveTripAsTemplate,
      createTemplate,
      renameTemplate,
      replaceTemplateItems,
      deleteTemplate,
      addIntention,
      updateIntention,
      deleteIntention,
    }),
    [
      trips,
      packingItems,
      templates,
      intentions,
      isLoading,
      upcomingTrips,
      pastTrips,
      archivedTrips,
      activeTrip,
      getTrip,
      packingFor,
      packingProgress,
      intentionsFor,
      createTrip,
      updateTrip,
      archiveTrip,
      deleteTrip,
      enterTravelMode,
      togglePackingItem,
      addPackingItem,
      updatePackingItem,
      deletePackingItem,
      dismissPackingItem,
      regeneratePacking,
      applyTemplate,
      saveTripAsTemplate,
      createTemplate,
      renameTemplate,
      replaceTemplateItems,
      deleteTemplate,
      addIntention,
      updateIntention,
      deleteIntention,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error('useTrips must be used within TripProvider');
  }
  return ctx;
}
