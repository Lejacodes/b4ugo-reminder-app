/**
 * A place that may trigger contextual reminders.
 * Coordinates come from geocoding or the device — never invented.
 */
export type SavedPlaceType = 'home' | 'place' | 'work' | 'other';

export type Place = {
  id: string;
  name: string;
  /** User-provided label, e.g. "University", "Grocery store". */
  label: string | null;
  type: SavedPlaceType;
  latitude: number | null;
  longitude: number | null;
  /** Whether this place is actively used for reminder triggers. */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlaceInput = Pick<Place, 'name' | 'label'> &
  Partial<Pick<Place, 'type' | 'latitude' | 'longitude'>>;
