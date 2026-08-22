/**
 * Current situation the reminder engine evaluates against.
 * Built from GPS, the active departure, or an explicit trip — never guessed.
 */
export type AppContextKind =
  | 'always'
  | 'leavingHome'
  | 'onTheWayBack'
  | 'specificPlace'
  | 'trip';

export type AppContext = {
  kind: AppContextKind;
  /** Saved place id when kind is specificPlace. */
  placeId?: string | null;
  /** Typed or saved place name. */
  placeName?: string | null;
  /** Planned trip id when kind is trip. */
  tripId?: string | null;
  /** Active Before U Go departure id. */
  departureId?: string | null;
};

export type ReminderPriority = 1 | 2 | 3 | 4;

export type RankedReminderSource = 'exact' | 'place' | 'trip' | 'routine' | 'always';

export type RankedReminder = {
  id: string;
  title: string;
  reason: string;
  priority: ReminderPriority;
  source: RankedReminderSource;
  href: string;
};

export type RoutineTrigger = 'leavingHome' | 'startingTrip' | 'returningFromTrip';

export type RoutineDefinition = {
  id: RoutineTrigger;
  title: string;
  contextKind: AppContextKind;
};
