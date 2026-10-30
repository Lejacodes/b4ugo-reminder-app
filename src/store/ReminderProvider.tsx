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

import { geocodingService } from '@/lib/geocoding';
import {
  loadContext,
  loadNecessities,
  loadReminders,
  placeService,
  saveNecessities,
  saveReminders,
  suggestionEngine,
  weatherService,
} from '@/lib/engines';
import {
  emptyDepartureSession,
  loadDepartureSession,
  saveDepartureSession,
  sessionCheckKey,
  type DepartureSession,
} from '@/lib/home/departure-session';
import { uniqueTripExtraDrafts } from '@/lib/home/trip-extras';
import { packingItemsForHomeBoard } from '@/lib/home/departing-trips';
import { dropDepartureRows, stripClonedNecessityRows } from '@/lib/reminders/context-rows';
import { todayIso } from '@/lib/trips/dates';
import { loadPackingItems, loadTrips } from '@/lib/trips/trip-store';
import { useAuth } from '@/store/AuthProvider';
import { useRecordRevision } from '@/hooks/use-record-revision';
import { useAccountGuard } from '@/hooks/use-account-guard';
import { collectionChange, localRepository } from '@/lib/sync/local';
import { persisted, unchanged, type SaveResult } from '@/lib/storage/mutation-result';
import {
  createId,
  titlesMatch,
  type BeforeUgoContext,
  type ContextInput,
  type CreateReminderInput,
  type PersonalNecessity,
  type Reminder,
  type ReminderCategory,
} from '@/types/reminder';

const STARTER_NECESSITIES = ['Keys', 'Phone', 'Wallet', 'Charger'];

function nowIso(): string {
  return new Date().toISOString();
}

function isUnpacked(item: Reminder): boolean {
  return item.status === 'open';
}

function buildNecessity(title: string, source: PersonalNecessity['source'] = 'user'): PersonalNecessity {
  return {
    id: createId('nec'),
    title: title.trim(),
    source,
    createdAt: nowIso(),
  };
}

function buildReminder(input: CreateReminderInput): Reminder {
  const stamp = nowIso();
  return {
    id: createId('rem'),
    title: input.title.trim(),
    category: input.category,
    status: 'open',
    createdAt: stamp,
    updatedAt: stamp,
    source: input.source ?? 'user',
    layer: input.layer ?? null,
    contextId: input.contextId ?? null,
    reason: input.reason ?? null,
    location: input.location ?? null,
    person: input.person ?? null,
    dueAt: input.dueAt ?? null,
  };
}

function isLegacyNecessityReminder(item: Reminder): boolean {
  return item.category === 'beforeUgo' && item.layer === 'always' && item.contextId == null;
}

function migrateLegacyNecessities(
  storedReminders: Reminder[],
  storedNecessities: PersonalNecessity[],
): { necessities: PersonalNecessity[]; reminders: Reminder[] } {
  const legacy = storedReminders.filter(isLegacyNecessityReminder);
  if (legacy.length === 0) {
    return { necessities: storedNecessities, reminders: storedReminders };
  }

  const merged = [...storedNecessities];
  for (const item of legacy) {
    if (!merged.some((nec) => titlesMatch(nec.title, item.title))) {
      merged.push({
        id: item.id,
        title: item.title,
        source: item.source,
        createdAt: item.createdAt,
      });
    }
  }

  return {
    necessities: merged,
    reminders: storedReminders.filter((item) => !isLegacyNecessityReminder(item)),
  };
}

type ReminderContextValue = {
  reminders: Reminder[];
  personalNecessities: PersonalNecessity[];
  context: BeforeUgoContext | null;
  isLoading: boolean;
  /** Legacy selector — cloned always-rows are no longer created. */
  alwaysChecklistItems: Reminder[];
  thisTripItems: Reminder[];
  suggestionItems: Reminder[];
  alwaysOpenItems: Reminder[];
  thisTripOpenItems: Reminder[];
  suggestionOpenItems: Reminder[];
  onTheWayBackItems: Reminder[];
  onTheWayBackOpen: Reminder[];
  specificItems: Reminder[];
  /** Unpacked Before U Go extras for the active departure (not necessity clones). */
  beforeUgoOpen: Reminder[];
  departureSession: DepartureSession;
  setGoingTo: (input: ContextInput) => Promise<void>;
  clearGoingTo: () => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addAlways: (title: string) => Promise<SaveResult<PersonalNecessity>>;
  addThisTrip: (title: string) => Promise<SaveResult<Reminder>>;
  addOnTheWayBack: (
    title: string,
    place?: string | { placeName: string; latitude?: number | null; longitude?: number | null },
  ) => Promise<SaveResult<Reminder>>;
  addSpecific: (
    title: string,
    extras?: { person?: string; placeName?: string; latitude?: number | null; longitude?: number | null },
  ) => Promise<void>;
  addReminder: (input: CreateReminderInput) => Promise<SaveResult<Reminder>>;
  updateReminder: (id: string, patch: { title?: string; dueAt?: string | null }) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  deleteReminders: (ids: string[]) => Promise<void>;
  deleteNecessity: (id: string) => Promise<void>;
  updateNecessityActiveDays: (id: string, activeDays: number[] | undefined) => Promise<void>;
  persistDepartureSession: (next: DepartureSession) => Promise<void>;
};

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const recordRevision = useRecordRevision(userId);
  const assertAccount = useAccountGuard(userId);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [personalNecessities, setPersonalNecessities] = useState<PersonalNecessity[]>([]);
  const [context, setContext] = useState<BeforeUgoContext | null>(null);
  const [departureSession, setDepartureSession] = useState<DepartureSession>(() => emptyDepartureSession());
  const [isLoading, setIsLoading] = useState(true);
  const remindersRef = useRef<Reminder[]>([]);
  const necessitiesRef = useRef<PersonalNecessity[]>([]);
  const contextRef = useRef<BeforeUgoContext | null>(null);
  const sessionRef = useRef<DepartureSession>(departureSession);

  useEffect(() => {
    remindersRef.current = reminders;
    necessitiesRef.current = personalNecessities;
    contextRef.current = context;
    sessionRef.current = departureSession;
  }, [context, departureSession, personalNecessities, reminders]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status === 'restoring') {
        setIsLoading(true);
        return;
      }
      if (!userId) {
        setReminders([]);
        setPersonalNecessities([]);
        setContext(null);
        setDepartureSession(emptyDepartureSession());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [storedReminders, storedNecessities, storedContext, storedSession] = await Promise.all([
          loadReminders(userId),
          loadNecessities(userId),
          loadContext(userId),
          loadDepartureSession(userId, todayIso()),
        ]);
        if (cancelled) return;

        const migrated = migrateLegacyNecessities(storedReminders, storedNecessities);
        let nextNecessities = migrated.necessities;
        let nextReminders = stripClonedNecessityRows(migrated.reminders);

        if (nextNecessities.length === 0 && !(await localRepository.hasHistory(userId, 'necessities'))) {
          nextNecessities = STARTER_NECESSITIES.map((title) => buildNecessity(title, 'learned'));
        }

        await Promise.all([
          saveNecessities(userId, nextNecessities),
          nextReminders.length !== storedReminders.length ||
          migrated.necessities.length !== storedNecessities.length
            ? saveReminders(userId, nextReminders)
            : Promise.resolve(),
        ]);

        if (cancelled) return;
        setPersonalNecessities(nextNecessities);
        setReminders(nextReminders);
        setContext(storedContext);
        setDepartureSession(storedSession);
      } catch {
        if (!cancelled) {
          setReminders([]);
          setPersonalNecessities([]);
          setContext(null);
          setDepartureSession(emptyDepartureSession());
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

  const persistReminders = useCallback(
    async (next: Reminder[]) => {
      assertAccount();
      if (userId) await saveReminders(userId, next, remindersRef.current);
      assertAccount();
      remindersRef.current = next;
      setReminders(next);
    },
    [userId, assertAccount],
  );

  const persistNecessities = useCallback(
    async (next: PersonalNecessity[]) => {
      assertAccount();
      if (userId) await saveNecessities(userId, next, necessitiesRef.current);
      assertAccount();
      necessitiesRef.current = next;
      setPersonalNecessities(next);
    },
    [userId, assertAccount],
  );

  const persistDepartureSession = useCallback(
    async (next: DepartureSession) => {
      assertAccount();
      if (userId) await saveDepartureSession(userId, next);
      assertAccount();
      sessionRef.current = next;
      setDepartureSession(next);
    },
    [userId, assertAccount],
  );

  const addReminder = useCallback(
    async (input: CreateReminderInput) => {
      const title = input.title.trim();
      if (!title) throw new Error('A reminder needs a title');
      const current = remindersRef.current;
      const duplicate = current.find(
        (item) =>
          titlesMatch(item.title, title) &&
          item.category === input.category &&
          item.layer === (input.layer ?? null) &&
          item.contextId === (input.contextId ?? null),
      );
      if (duplicate) return unchanged(duplicate);
      const entity = buildReminder({ ...input, title });
      await persistReminders([...current, entity]);
      return persisted(entity);
    },
    [persistReminders],
  );

  const toggleReminder = useCallback(
    async (id: string) => {
      const current = remindersRef.current;
      const target = current.find((item) => item.id === id);
      if (!target) return;
      const next = current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: (item.status === 'open' ? 'done' : 'open') as Reminder['status'],
              updatedAt: nowIso(),
            }
          : item,
      );
      await persistReminders(next);
    },
    [persistReminders],
  );

  const updateReminder = useCallback(
    async (id: string, patch: { title?: string; dueAt?: string | null }) => {
      const current = remindersRef.current;
      if (!current.some((item) => item.id === id)) return;
      const next = current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: patch.title?.trim() || item.title,
              dueAt: patch.dueAt !== undefined ? patch.dueAt : item.dueAt,
              updatedAt: nowIso(),
            }
          : item,
      );
      await persistReminders(next);
    },
    [persistReminders],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      const current = remindersRef.current;
      if (!current.some((item) => item.id === id)) return;
      await persistReminders(current.filter((item) => item.id !== id));
    },
    [persistReminders],
  );

  const deleteReminders = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const drop = new Set(ids);
      const current = remindersRef.current;
      const next = current.filter((item) => !drop.has(item.id));
      if (next.length === current.length) return;
      await persistReminders(next);
    },
    [persistReminders],
  );

  const deleteNecessity = useCallback(
    async (id: string) => {
      assertAccount();
      const current = necessitiesRef.current;
      if (!current.some((item) => item.id === id)) return;
      const nextNecessities = current.filter((item) => item.id !== id);
      const session = sessionRef.current;
      const key = sessionCheckKey('nec', id);
      const { [key]: _removed, ...checks } = session.checks;
      const nextSession = {
        ...session,
        checks,
        cleared: session.cleared.filter((value) => value !== key),
      };
      if (!userId) throw new Error('Sign in before editing essentials');
      await localRepository.write(userId, [collectionChange('necessities', current, nextNecessities)], { departureSession: nextSession });
      assertAccount();
      necessitiesRef.current = nextNecessities; setPersonalNecessities(nextNecessities);
      sessionRef.current = nextSession; setDepartureSession(nextSession);
    },
    [userId, assertAccount],
  );

  const updateNecessityActiveDays = useCallback(
    async (id: string, activeDays: number[] | undefined) => {
      const current = necessitiesRef.current;
      if (!current.some((item) => item.id === id)) return;
      const next = current.map((item) =>
        item.id === id
          ? {
              ...item,
              activeDays: activeDays && activeDays.length > 0 ? activeDays : undefined,
            }
          : item,
      );
      await persistNecessities(next);
    },
    [persistNecessities],
  );

  const buildTripChecklist = useCallback(async (nextContext: BeforeUgoContext): Promise<Reminder[]> => {
    const weather =
      nextContext.latitude != null && nextContext.longitude != null
        ? await weatherService.getSnapshot({
            latitude: nextContext.latitude,
            longitude: nextContext.longitude,
          })
        : await weatherService.getSnapshot();
    const pack = suggestionEngine.getTripPack(nextContext);
    let packingTitles: string[] = [];
    if (userId) {
      try {
        const [trips, packing] = await Promise.all([loadTrips(userId), loadPackingItems(userId)]);
        packingTitles = packingItemsForHomeBoard(trips, packing, todayIso()).map((item) => item.title);
      } catch {
        packingTitles = [];
      }
    }
    const drafts = uniqueTripExtraDrafts({
      necessityTitles: necessitiesRef.current.map((item) => item.title),
      packingTitles,
      pack,
      suggestions: suggestionEngine.getSuggestions(nextContext, weather, [
        ...necessitiesRef.current.map((item) => item.title),
        ...pack.map((item) => item.title),
      ]),
      destination: nextContext.destination,
    });

    return drafts.map((draft) =>
      buildReminder({
        title: draft.title,
        category: 'beforeUgo',
        layer: draft.layer,
        source: draft.source,
        reason: draft.reason,
        contextId: nextContext.id,
      }),
    );
  }, [userId]);

  const setGoingTo = useCallback(
    async (input: ContextInput) => {
      assertAccount();
      const destination = input.destination.trim();
      if (!destination) return;

      const hasCoords =
        input.latitude != null &&
        input.longitude != null &&
        Number.isFinite(input.latitude) &&
        Number.isFinite(input.longitude);

      const geo = hasCoords
        ? null
        : await geocodingService.searchDestination(destination);

      const nextContext: BeforeUgoContext = {
        id: createId('ctx'),
        destination,
        purpose: input.purpose?.trim() || null,
        person: input.person?.trim() || null,
        dateTime: input.dateTime ?? null,
        createdAt: nowIso(),
        latitude: hasCoords ? input.latitude! : (geo?.latitude ?? null),
        longitude: hasCoords ? input.longitude! : (geo?.longitude ?? null),
        timezone: geo?.timezone ?? null,
        country: input.country ?? geo?.country ?? null,
        region: input.region ?? geo?.region ?? null,
      };

      const previousId = contextRef.current?.id ?? null;
      const generated = await buildTripChecklist(nextContext);
      const kept = dropDepartureRows(remindersRef.current, previousId);
      assertAccount();
      if (!userId) throw new Error('Sign in before saving a departure');
      const nextReminders = [...kept, ...generated];
      await localRepository.write(userId, [
        { collection: 'context', before: contextRef.current ? [{ id: 'current', value: contextRef.current }] : [],
          after: [{ id: 'current', value: nextContext }] },
        collectionChange('reminders', remindersRef.current, nextReminders),
      ]);
      assertAccount();
      remindersRef.current = nextReminders; setReminders(nextReminders);
      contextRef.current = nextContext; setContext(nextContext);
    },
    [buildTripChecklist, userId, assertAccount],
  );

  const clearGoingTo = useCallback(async () => {
    assertAccount();
    if (!userId) throw new Error('Sign in before editing a departure');
    const previousId = contextRef.current?.id ?? null;
    const nextReminders = dropDepartureRows(remindersRef.current, previousId);
    const nextSession = emptyDepartureSession();
    await localRepository.write(userId, [collectionChange('reminders', remindersRef.current, nextReminders),
      { collection: 'context', before: contextRef.current ? [{ id: 'current', value: contextRef.current }] : [], after: [] },
    ], { departureSession: nextSession });
    assertAccount();
    remindersRef.current = nextReminders; setReminders(nextReminders);
    contextRef.current = null; setContext(null);
    sessionRef.current = nextSession; setDepartureSession(nextSession);
  }, [userId, assertAccount]);

  const addAlways = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error('An essential needs a title');

      const currentNecessities = necessitiesRef.current;
      const existing = currentNecessities.find((item) => titlesMatch(item.title, trimmed));
      if (existing) return unchanged(existing);
      const entity = buildNecessity(trimmed, 'user');
      await persistNecessities([...currentNecessities, entity]);
      return persisted(entity);
    },
    [persistNecessities],
  );

  const addThisTrip = useCallback(
    async (title: string) => {
      const activeContext = contextRef.current;
      if (!activeContext) throw new Error('Choose a departure before adding to it');
      return addReminder({
        title,
        category: 'beforeUgo',
        layer: 'thisTrip',
        contextId: activeContext.id,
        source: 'user',
      });
    },
    [addReminder],
  );

  const addOnTheWayBack = useCallback(
    async (
      title: string,
      placeInput?: string | { placeName: string; latitude?: number | null; longitude?: number | null },
    ) => {
      let location = null as { placeName: string; latitude: number | null; longitude: number | null } | null;

      if (typeof placeInput === 'object' && placeInput?.placeName?.trim()) {
        location = {
          placeName: placeInput.placeName.trim(),
          latitude: placeInput.latitude ?? null,
          longitude: placeInput.longitude ?? null,
        };
        if (location.latitude == null || location.longitude == null) {
          location = await placeService.resolve(location.placeName);
        }
      } else if (typeof placeInput === 'string' && placeInput.trim()) {
        location = await placeService.resolve(placeInput.trim());
      }

      return addReminder({
        title,
        category: 'onTheWayBack',
        source: 'user',
        location: location
          ? {
              placeName: location.placeName,
              latitude: location.latitude,
              longitude: location.longitude,
              radiusMeters: null,
            }
          : null,
      });
    },
    [addReminder],
  );

  const addSpecific = useCallback(
    async (
      title: string,
      extras?: {
        person?: string;
        placeName?: string;
        latitude?: number | null;
        longitude?: number | null;
      },
    ) => {
      const place = extras?.placeName?.trim();
      let location = null as { placeName: string; latitude: number | null; longitude: number | null } | null;
      if (place) {
        location = {
          placeName: place,
          latitude: extras?.latitude ?? null,
          longitude: extras?.longitude ?? null,
        };
        if (location.latitude == null || location.longitude == null) {
          location = await placeService.resolve(place);
        }
      }
      await addReminder({
        title,
        category: 'specific',
        source: 'user',
        person: extras?.person?.trim() || null,
        location: location
          ? {
              placeName: location.placeName,
              latitude: location.latitude,
              longitude: location.longitude,
              radiusMeters: null,
            }
          : null,
      });
    },
    [addReminder],
  );

  const tripChecklistItems = useMemo(
    () =>
      reminders.filter(
        (item) =>
          item.category === 'beforeUgo' &&
          context != null &&
          item.contextId === context.id,
      ),
    [reminders, context],
  );

  const alwaysChecklistItems = useMemo(
    () => tripChecklistItems.filter((item) => item.layer === 'always'),
    [tripChecklistItems],
  );

  const thisTripItems = useMemo(
    () => tripChecklistItems.filter((item) => item.layer === 'thisTrip'),
    [tripChecklistItems],
  );

  const suggestionItems = useMemo(
    () => tripChecklistItems.filter((item) => item.layer === 'suggestion'),
    [tripChecklistItems],
  );

  const onTheWayBackItems = useMemo(
    () => reminders.filter((item) => item.category === 'onTheWayBack'),
    [reminders],
  );

  const alwaysOpenItems = useMemo(
    () => alwaysChecklistItems.filter(isUnpacked),
    [alwaysChecklistItems],
  );

  const thisTripOpenItems = useMemo(
    () => thisTripItems.filter(isUnpacked),
    [thisTripItems],
  );

  const suggestionOpenItems = useMemo(
    () => suggestionItems.filter(isUnpacked),
    [suggestionItems],
  );

  const onTheWayBackOpen = useMemo(
    () => onTheWayBackItems.filter(isUnpacked),
    [onTheWayBackItems],
  );

  const specificItems = useMemo(
    () => reminders.filter((item) => item.category === 'specific'),
    [reminders],
  );

  const beforeUgoOpen = useMemo(
    () => tripChecklistItems.filter(isUnpacked),
    [tripChecklistItems],
  );

  const value = useMemo<ReminderContextValue>(
    () => ({
      reminders,
      personalNecessities,
      context,
      isLoading,
      alwaysChecklistItems,
      thisTripItems,
      suggestionItems,
      alwaysOpenItems,
      thisTripOpenItems,
      suggestionOpenItems,
      onTheWayBackItems,
      onTheWayBackOpen,
      specificItems,
      beforeUgoOpen,
      departureSession,
      setGoingTo,
      clearGoingTo,
      toggleReminder,
      addAlways,
      addThisTrip,
      addOnTheWayBack,
      addSpecific,
      addReminder,
      updateReminder,
      deleteReminder,
      deleteReminders,
      deleteNecessity,
      updateNecessityActiveDays,
      persistDepartureSession,
    }),
    [
      reminders,
      personalNecessities,
      context,
      isLoading,
      alwaysChecklistItems,
      thisTripItems,
      suggestionItems,
      alwaysOpenItems,
      thisTripOpenItems,
      suggestionOpenItems,
      onTheWayBackItems,
      onTheWayBackOpen,
      specificItems,
      beforeUgoOpen,
      departureSession,
      setGoingTo,
      clearGoingTo,
      toggleReminder,
      addAlways,
      addThisTrip,
      addOnTheWayBack,
      addSpecific,
      addReminder,
      updateReminder,
      deleteReminder,
      deleteReminders,
      deleteNecessity,
      updateNecessityActiveDays,
      persistDepartureSession,
    ],
  );

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminders(): ReminderContextValue {
  const ctx = useContext(ReminderContext);
  if (!ctx) {
    throw new Error('useReminders must be used within ReminderProvider');
  }
  return ctx;
}

export type { ReminderCategory };
