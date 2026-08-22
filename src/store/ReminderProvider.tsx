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

import {
  loadContext,
  loadNecessities,
  loadReminders,
  placeService,
  saveContext,
  saveNecessities,
  saveReminders,
  suggestionEngine,
  weatherService,
} from '@/lib/engines';
import { useAuth } from '@/store/AuthProvider';
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
  /** Trip checklist rows copied from personal necessities for the active context. */
  alwaysChecklistItems: Reminder[];
  thisTripItems: Reminder[];
  suggestionItems: Reminder[];
  alwaysOpenItems: Reminder[];
  thisTripOpenItems: Reminder[];
  suggestionOpenItems: Reminder[];
  onTheWayBackItems: Reminder[];
  onTheWayBackOpen: Reminder[];
  specificItems: Reminder[];
  /** Unpacked Before U Go checklist rows for the active trip only. */
  beforeUgoOpen: Reminder[];
  setGoingTo: (input: ContextInput) => Promise<void>;
  clearGoingTo: () => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addAlways: (title: string) => Promise<void>;
  addThisTrip: (title: string) => Promise<void>;
  addOnTheWayBack: (title: string, placeName?: string) => Promise<void>;
  addSpecific: (title: string, extras?: { person?: string; placeName?: string }) => Promise<void>;
  addReminder: (input: CreateReminderInput) => Promise<void>;
};

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [personalNecessities, setPersonalNecessities] = useState<PersonalNecessity[]>([]);
  const [context, setContext] = useState<BeforeUgoContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const remindersRef = useRef<Reminder[]>([]);
  const necessitiesRef = useRef<PersonalNecessity[]>([]);
  const contextRef = useRef<BeforeUgoContext | null>(null);
  remindersRef.current = reminders;
  necessitiesRef.current = personalNecessities;
  contextRef.current = context;

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
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [storedReminders, storedNecessities, storedContext] = await Promise.all([
          loadReminders(userId),
          loadNecessities(userId),
          loadContext(userId),
        ]);
        if (cancelled) return;

        const migrated = migrateLegacyNecessities(storedReminders, storedNecessities);
        let nextNecessities = migrated.necessities;
        let nextReminders = migrated.reminders;

        if (nextNecessities.length === 0) {
          nextNecessities = STARTER_NECESSITIES.map((title) => buildNecessity(title, 'learned'));
        }

        await Promise.all([
          saveNecessities(userId, nextNecessities),
          migrated.necessities.length !== storedNecessities.length ||
          migrated.reminders.length !== storedReminders.length
            ? saveReminders(userId, nextReminders)
            : Promise.resolve(),
        ]);

        if (cancelled) return;
        setPersonalNecessities(nextNecessities);
        setReminders(nextReminders);
        setContext(storedContext);
      } catch {
        if (!cancelled) {
          setReminders([]);
          setPersonalNecessities([]);
          setContext(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const persistReminders = useCallback(
    async (next: Reminder[]) => {
      remindersRef.current = next;
      setReminders(next);
      if (!userId) return;
      try {
        await saveReminders(userId, next);
      } catch {
        // Keep in-memory packed state even if persistence fails.
      }
    },
    [userId],
  );

  const persistNecessities = useCallback(
    async (next: PersonalNecessity[]) => {
      necessitiesRef.current = next;
      setPersonalNecessities(next);
      if (!userId) return;
      try {
        await saveNecessities(userId, next);
      } catch {
        // Keep in-memory necessities even if persistence fails.
      }
    },
    [userId],
  );

  const persistContext = useCallback(
    async (next: BeforeUgoContext | null) => {
      contextRef.current = next;
      setContext(next);
      if (userId) await saveContext(userId, next);
    },
    [userId],
  );

  const addReminder = useCallback(
    async (input: CreateReminderInput) => {
      const title = input.title.trim();
      if (!title) return;
      const current = remindersRef.current;
      const duplicate = current.some(
        (item) =>
          titlesMatch(item.title, title) &&
          item.category === input.category &&
          item.layer === (input.layer ?? null) &&
          item.contextId === (input.contextId ?? null),
      );
      if (duplicate) return;
      await persistReminders([...current, buildReminder({ ...input, title })]);
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

  const buildTripChecklist = useCallback(async (nextContext: BeforeUgoContext): Promise<Reminder[]> => {
    const necessities = necessitiesRef.current;
    const weather = await weatherService.getSnapshot();
    const pack = suggestionEngine.getTripPack(nextContext);
    const taken = new Set<string>();
    const generated: Reminder[] = [];

    const push = (input: CreateReminderInput) => {
      const key = input.title.trim().toLowerCase();
      if (!key || taken.has(key)) return;
      taken.add(key);
      generated.push(
        buildReminder({
          ...input,
          contextId: nextContext.id,
        }),
      );
    };

    for (const necessity of necessities) {
      push({
        title: necessity.title,
        category: 'beforeUgo',
        layer: 'always',
        source: necessity.source,
      });
    }

    for (const item of pack) {
      push({
        title: item.title,
        category: 'beforeUgo',
        layer: 'thisTrip',
        source: 'rule',
        reason: item.reason ?? `for ${nextContext.destination}`,
      });
    }

    const suggestions = suggestionEngine.getSuggestions(
      nextContext,
      weather,
      generated.map((item) => item.title),
    );
    for (const item of suggestions) {
      push({
        title: item.title,
        category: 'beforeUgo',
        layer: 'suggestion',
        source: item.source,
        reason: item.reason,
      });
    }

    return generated;
  }, []);

  const setGoingTo = useCallback(
    async (input: ContextInput) => {
      const destination = input.destination.trim();
      if (!destination) return;

      const nextContext: BeforeUgoContext = {
        id: createId('ctx'),
        destination,
        purpose: input.purpose?.trim() || null,
        person: input.person?.trim() || null,
        dateTime: input.dateTime ?? null,
        createdAt: nowIso(),
      };

      const generated = await buildTripChecklist(nextContext);
      await persistContext(nextContext);
      await persistReminders([...remindersRef.current, ...generated]);
    },
    [buildTripChecklist, persistContext, persistReminders],
  );

  const clearGoingTo = useCallback(async () => {
    await persistContext(null);
  }, [persistContext]);

  const addAlways = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const currentNecessities = necessitiesRef.current;
      const exists = currentNecessities.some((item) => titlesMatch(item.title, trimmed));
      if (!exists) {
        await persistNecessities([...currentNecessities, buildNecessity(trimmed, 'user')]);
      }

      const activeContext = contextRef.current;
      if (activeContext) {
        await addReminder({
          title: trimmed,
          category: 'beforeUgo',
          layer: 'always',
          contextId: activeContext.id,
          source: 'user',
        });
      }
    },
    [addReminder, persistNecessities],
  );

  const addThisTrip = useCallback(
    async (title: string) => {
      const activeContext = contextRef.current;
      if (!activeContext) return;
      await addReminder({
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
    async (title: string, placeName?: string) => {
      const place = placeName?.trim();
      const location = place ? await placeService.resolve(place) : null;
      await addReminder({
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
    async (title: string, extras?: { person?: string; placeName?: string }) => {
      const place = extras?.placeName?.trim();
      const location = place ? await placeService.resolve(place) : null;
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
      setGoingTo,
      clearGoingTo,
      toggleReminder,
      addAlways,
      addThisTrip,
      addOnTheWayBack,
      addSpecific,
      addReminder,
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
      setGoingTo,
      clearGoingTo,
      toggleReminder,
      addAlways,
      addThisTrip,
      addOnTheWayBack,
      addSpecific,
      addReminder,
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
