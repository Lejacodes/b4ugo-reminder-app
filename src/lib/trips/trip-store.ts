import { readCollection, writeCollection } from '@/lib/sync/local';
import type { PackingItem, PackingTemplate, TravelIntention, Trip } from '@/types/trip';

export const loadTrips = (userId: string) => readCollection<Trip>(userId, 'trips');
export const saveTrips = (userId: string, value: Trip[], before?: Trip[]) => writeCollection(userId, 'trips', value, before);
export const loadPackingItems = (userId: string) => readCollection<PackingItem>(userId, 'packingItems');
export const savePackingItems = (userId: string, value: PackingItem[], before?: PackingItem[]) => writeCollection(userId, 'packingItems', value, before);
export const loadPackingTemplates = (userId: string) => readCollection<PackingTemplate>(userId, 'packingTemplates');
export const savePackingTemplates = (userId: string, value: PackingTemplate[], before?: PackingTemplate[]) => writeCollection(userId, 'packingTemplates', value, before);
export const loadTravelIntentions = (userId: string) => readCollection<TravelIntention>(userId, 'travelIntentions');
export const saveTravelIntentions = (userId: string, value: TravelIntention[], before?: TravelIntention[]) => writeCollection(userId, 'travelIntentions', value, before);
