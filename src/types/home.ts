/**
 * Home-screen journey data.
 *
 * These types describe what Home displays today from mock data. They are shaped
 * so a real reminder engine can replace `getHomeMockData()` later without
 * changing the UI components.
 */

import type { WeatherBadgeIcon } from '@/lib/context/weather-injections';

/** Things to take or do before leaving somewhere. */
export type BeforeUgoItem = {
  id: string;
  label: string;
  checked?: boolean;
  badge?: string | null;
  badgeIcon?: WeatherBadgeIcon | null;
  kind?: 'reminder' | 'necessity' | 'weather' | 'packing';
};

/** Things to remember while out, optionally tied to a place. */
export type OnTheWayBackItem = {
  id: string;
  label: string;
  placeName: string | null;
};

export type OnTheWayBackGroup = {
  placeName: string;
  items: { id: string; label: string }[];
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
