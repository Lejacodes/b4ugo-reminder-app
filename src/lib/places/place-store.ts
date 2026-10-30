import { readCollection, writeCollection } from '@/lib/sync/local';
import type { Place } from '@/types/place';

export const loadPlaces = (userId: string) => readCollection<Place>(userId, 'savedPlaces');
export const savePlaces = (userId: string, value: Place[], before?: Place[]) => writeCollection(userId, 'savedPlaces', value, before);
