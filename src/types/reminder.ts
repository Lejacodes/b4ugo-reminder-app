/**
 * Memory model — the three kinds of thing BLUGO can hold.
 *
 * beforeUgo     — take/do this before leaving
 * onTheWayBack  — buy/do this while already out
 * specific      — a contextual memory that is neither of the above
 *
 * Location fields exist so a geofence service can plug in later.
 * Coordinates stay null until a real PlaceService fills them.
 */

export type ReminderCategory = 'beforeUgo' | 'onTheWayBack' | 'specific';
export type ReminderStatus = 'open' | 'done';
export type ReminderSource = 'user' | 'learned' | 'rule' | 'weather';
export type BeforeUgoLayer = 'always' | 'thisTrip' | 'suggestion';

export type ReminderLocation = {
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
};

export type BeforeUgoContext = {
  id: string;
  destination: string;
  purpose: string | null;
  person: string | null;
  dateTime: string | null;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  country?: string | null;
  region?: string | null;
};

/** Persistent learned/user necessities — survive every trip; never use packed state here. */
export type PersonalNecessity = {
  id: string;
  title: string;
  source: ReminderSource;
  createdAt: string;
};

export type Reminder = {
  id: string;
  title: string;
  category: ReminderCategory;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  source: ReminderSource;
  layer: BeforeUgoLayer | null;
  contextId: string | null;
  reason: string | null;
  location: ReminderLocation | null;
  person: string | null;
  dueAt: string | null;
};

export type CreateReminderInput = {
  title: string;
  category: ReminderCategory;
  source?: ReminderSource;
  layer?: BeforeUgoLayer | null;
  contextId?: string | null;
  reason?: string | null;
  location?: ReminderLocation | null;
  person?: string | null;
  dueAt?: string | null;
};

export type ContextInput = {
  destination: string;
  purpose?: string | null;
  person?: string | null;
  dateTime?: string | null;
};

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titlesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
