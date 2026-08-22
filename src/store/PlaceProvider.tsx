import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loadPlaces, savePlaces } from '@/lib/places/place-store';
import { useAuth } from '@/store/AuthProvider';
import { createId } from '@/types/reminder';
import type { Place, SavedPlaceType } from '@/types/place';

type PlaceContextValue = {
  places: Place[];
  home: Place | null;
  isLoading: boolean;
  setHome: (input: { name: string; latitude: number | null; longitude: number | null }) => Promise<void>;
  upsertPlace: (input: {
    name: string;
    type?: SavedPlaceType;
    latitude?: number | null;
    longitude?: number | null;
    label?: string | null;
  }) => Promise<Place | null>;
};

const PlaceContext = createContext<PlaceContextValue | null>(null);

export function PlaceProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (status === 'restoring') {
        setIsLoading(true);
        return;
      }
      if (!userId) {
        setPlaces([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const next = await loadPlaces(userId);
        if (!cancelled) setPlaces(next);
      } catch {
        if (!cancelled) setPlaces([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const persist = useCallback(
    async (next: Place[]) => {
      setPlaces(next);
      if (!userId) return;
      try {
        await savePlaces(userId, next);
      } catch {
        // Keep in-memory places if persistence fails.
      }
    },
    [userId],
  );

  const upsertPlace = useCallback(
    async (input: {
      name: string;
      type?: SavedPlaceType;
      latitude?: number | null;
      longitude?: number | null;
      label?: string | null;
    }) => {
      const name = input.name.trim();
      if (!name) return null;
      const stamp = new Date().toISOString();
      const existing = places.find(
        (place) =>
          place.name.trim().toLowerCase() === name.toLowerCase() && place.type === (input.type ?? 'place'),
      );
      const nextPlace: Place = existing
        ? {
            ...existing,
            latitude: input.latitude ?? existing.latitude,
            longitude: input.longitude ?? existing.longitude,
            label: input.label ?? existing.label,
            updatedAt: stamp,
          }
        : {
            id: createId('place'),
            name,
            label: input.label ?? null,
            type: input.type ?? 'place',
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            isActive: true,
            createdAt: stamp,
            updatedAt: stamp,
          };
      const next = existing
        ? places.map((place) => (place.id === existing.id ? nextPlace : place))
        : [...places, nextPlace];
      await persist(next);
      return nextPlace;
    },
    [persist, places],
  );

  const setHome = useCallback(
    async (input: { name: string; latitude: number | null; longitude: number | null }) => {
      const stamp = new Date().toISOString();
      const current = places.find((place) => place.type === 'home');
      const home: Place = {
        id: current?.id ?? createId('place'),
        name: input.name.trim() || 'Home',
        label: current?.label ?? null,
        type: 'home',
        latitude: input.latitude,
        longitude: input.longitude,
        isActive: true,
        createdAt: current?.createdAt ?? stamp,
        updatedAt: stamp,
      };
      const next = current
        ? places.map((place) => (place.id === current.id ? home : place))
        : [...places, home];
      await persist(next);
    },
    [persist, places],
  );

  const home = useMemo(() => places.find((place) => place.type === 'home') ?? null, [places]);

  const value = useMemo<PlaceContextValue>(
    () => ({ places, home, isLoading, setHome, upsertPlace }),
    [places, home, isLoading, setHome, upsertPlace],
  );

  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>;
}

export function usePlaces(): PlaceContextValue {
  const ctx = useContext(PlaceContext);
  if (!ctx) throw new Error('usePlaces must be used within PlaceProvider');
  return ctx;
}
