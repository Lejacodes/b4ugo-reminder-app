import { preferencesStorage } from '@/lib/storage/preferences-storage';

import type { PlaceAnchor } from './place-anchors';

const MANIFEST_KEY = 'blugo.geofenceManifest';

export type GeofenceManifestRegion = {
  placeName: string;
  items: Array<{ reminderId: string; title: string; href: string }>;
};

export type GeofenceManifest = {
  regions: Record<string, GeofenceManifestRegion>;
  updatedAt: string;
};

export async function saveGeofenceManifest(anchors: PlaceAnchor[]): Promise<void> {
  const regions: GeofenceManifest['regions'] = {};
  for (const anchor of anchors) {
    regions[anchor.id] = {
      placeName: anchor.placeName,
      items: anchor.items.map((item) => ({
        reminderId: item.reminderId,
        title: item.title,
        href: item.href,
      })),
    };
  }
  const manifest: GeofenceManifest = { regions, updatedAt: new Date().toISOString() };
  await preferencesStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

export async function loadGeofenceManifest(): Promise<GeofenceManifest> {
  const raw = await preferencesStorage.getItem(MANIFEST_KEY);
  if (!raw) return { regions: {}, updatedAt: '' };
  try {
    const parsed = JSON.parse(raw) as GeofenceManifest;
    if (!parsed?.regions || typeof parsed.regions !== 'object') {
      return { regions: {}, updatedAt: '' };
    }
    return parsed;
  } catch {
    return { regions: {}, updatedAt: '' };
  }
}

export async function clearGeofenceManifest(): Promise<void> {
  await preferencesStorage.removeItem(MANIFEST_KEY);
}
