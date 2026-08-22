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

/** Things to remember while out, optionally tied to a place. */
export type OnTheWayBackItem = {
  id: string;
  label: string;
  placeName: string | null;
};

/** Quiet summary for the small "today" note. */
export type TodaySummary = {
  thingsWaiting: number;
  alongTheWay: number;
};

export type HomeJourneyData = {
  beforeUgo: BeforeUgoItem[];
  onTheWayBack: OnTheWayBackItem[];
  today: TodaySummary;
};
