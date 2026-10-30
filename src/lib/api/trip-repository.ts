import { requireSessionUserId } from '@/lib/supabase/client';
import { loadTrips, loadPackingItems, loadPackingTemplates, loadTravelIntentions, saveTrips, savePackingItems, savePackingTemplates, saveTravelIntentions } from '@/lib/trips/trip-store';
import type { PackingItem, PackingTemplate, TravelIntention, Trip } from '@/types/trip';

/** Compatibility facade over the local repository/outbox. */
export const tripRepository = {
  listTrips: async () => loadTrips(await requireSessionUserId()),
  listPackingItems: async () => loadPackingItems(await requireSessionUserId()),
  listTemplates: async () => loadPackingTemplates(await requireSessionUserId()),
  listIntentions: async () => loadTravelIntentions(await requireSessionUserId()),
  replaceTrips: async (records: Trip[]) => saveTrips(await requireSessionUserId(), records),
  replacePackingItems: async (records: PackingItem[]) => savePackingItems(await requireSessionUserId(), records),
  replaceTemplates: async (records: PackingTemplate[]) => savePackingTemplates(await requireSessionUserId(), records),
  replaceIntentions: async (records: TravelIntention[]) => saveTravelIntentions(await requireSessionUserId(), records),
};
