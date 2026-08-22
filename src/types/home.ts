/**
 * Home-screen journey data.
 *
 * These types describe what Home displays today from mock data. They are shaped
 * so a real reminder engine can replace `getHomeMockData()` later without
 * changing the UI components.
 */

/** Things to take or do before leaving somewhere. */
export type BeforeUgoItem = {
  id: string;
  label: string;
};

/** Things to remember while out, tied to a place for later geofencing. */
export type OnTheWayBackItem = {
  id: string;
  label: string;
  /** Human-readable place name — not coordinates. Location is contextual only. */
  placeName: string;
};

/** Quiet summary for the small "today" note. */
export type TodaySummary = {
  thingsWaiting: number;
  placesNearby: number;
  upcomingTrip?: {
    destination: string;
    daysUntil: number;
  };
};

export type HomeJourneyData = {
  beforeUgo: BeforeUgoItem[];
  onTheWayBack: OnTheWayBackItem[];
  today: TodaySummary;
};
