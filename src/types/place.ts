/**
 * A place that may trigger contextual reminders.
 * Location coordinates are deferred until location services are implemented.
 */
export type Place = {
  id: string;
  name: string;
  /** User-provided label, e.g. "University", "Grocery store". */
  label: string | null;
  /** Whether this place is actively used for reminder triggers. */
  isActive: boolean;
  createdAt: string;
};

export type CreatePlaceInput = Pick<Place, 'name' | 'label'>;
