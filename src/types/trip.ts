/**
 * Trips / occasions — planning, packing, and travel intentions.
 *
 * Packing `checked` is per-trip only. It is never a personal necessity.
 * GPS, weather APIs, and recommendation models are not connected.
 */

export type TripStatus = 'planned' | 'active' | 'archived';

export type PackingCategory =
  | 'documents'
  | 'essentials'
  | 'clothing'
  | 'toiletries'
  | 'health'
  | 'electronics'
  | 'activity'
  | 'other';

export type PackingSource = 'user' | 'generated' | 'template';

export type TravelIntentionType = 'food' | 'place' | 'activity' | 'other';

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  activity: string | null;
  season: string | null;
  accommodation: string | null;
  transportation: string | null;
  notes: string | null;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  country?: string | null;
  region?: string | null;
};

export type TripDraft = {
  title: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  activity?: string | null;
  season?: string | null;
  accommodation?: string | null;
  transportation?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  country?: string | null;
  region?: string | null;
};

export type PackingItem = {
  id: string;
  tripId: string;
  title: string;
  category: PackingCategory;
  checked: boolean;
  source: PackingSource;
  reason: string | null;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PackingTemplateItem = {
  title: string;
  category: PackingCategory;
};

export type PackingTemplate = {
  id: string;
  name: string;
  items: PackingTemplateItem[];
  createdAt: string;
  updatedAt: string;
};

export type TravelIntention = {
  id: string;
  tripId: string;
  title: string;
  type: TravelIntentionType;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PackingSuggestion = {
  title: string;
  category: PackingCategory;
  reason: string;
};

export const PACKING_CATEGORIES: PackingCategory[] = [
  'documents',
  'essentials',
  'clothing',
  'toiletries',
  'health',
  'electronics',
  'activity',
  'other',
];

export const PACKING_CATEGORY_LABELS: Record<PackingCategory, string> = {
  documents: 'documents',
  essentials: 'essentials',
  clothing: 'clothing',
  toiletries: 'toiletries',
  health: 'health',
  electronics: 'electronics',
  activity: 'activity-specific',
  other: 'other',
};

export const TRAVEL_INTENTION_LABELS: Record<TravelIntentionType, string> = {
  food: 'want to try',
  place: 'want to visit',
  activity: 'want to do',
  other: 'other',
};
