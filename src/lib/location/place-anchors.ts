import { distanceMeters } from '@/lib/geo/distance';
import { hrefForDueReminder } from '@/lib/notifications/routing';
import { isValidCoordinates } from '@/lib/location/coordinates';
import type { Place } from '@/types/place';
import type { Reminder } from '@/types/reminder';

/** Radius for shops/markets — wide enough when passing by in a car. */
export const SHOP_GEOFENCE_RADIUS_M = 250;

/** iOS caps monitored geofences at 20 regions. */
export const MAX_GEOFENCE_REGIONS = 20;

/** Merge reminders pinned within this distance to the same shop. */
export const PLACE_CLUSTER_METERS = 80;

export type PlaceAnchorItem = {
  reminderId: string;
  title: string;
  href: string;
};

export type PlaceAnchor = {
  id: string;
  placeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  items: PlaceAnchorItem[];
};

function placeKey(name: string): string {
  return name.trim().toLowerCase();
}

function hrefForReminder(item: Reminder): string {
  if (item.category === 'onTheWayBack') return '/on-the-way-back';
  if (item.category === 'beforeUgo') return '/before-ugo';
  return hrefForDueReminder({ category: item.category, contextId: item.contextId });
}

function anchorId(latitude: number, longitude: number): string {
  return `blugo:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function findCluster(anchors: PlaceAnchor[], latitude: number, longitude: number): PlaceAnchor | null {
  for (const anchor of anchors) {
    if (
      distanceMeters({ latitude, longitude }, { latitude: anchor.latitude, longitude: anchor.longitude }) <=
      PLACE_CLUSTER_METERS
    ) {
      return anchor;
    }
  }
  return null;
}

function addItem(anchor: PlaceAnchor, item: Reminder): void {
  if (anchor.items.some((entry) => entry.reminderId === item.id)) return;
  anchor.items.push({
    reminderId: item.id,
    title: item.title,
    href: hrefForReminder(item),
  });
}

function upsertAnchor(
  anchors: PlaceAnchor[],
  input: { placeName: string; latitude: number; longitude: number; item?: Reminder },
): PlaceAnchor {
  const cluster = findCluster(anchors, input.latitude, input.longitude);
  if (cluster) {
    if (input.placeName.length > cluster.placeName.length) cluster.placeName = input.placeName;
    if (input.item) addItem(cluster, input.item);
    return cluster;
  }

  const next: PlaceAnchor = {
    id: anchorId(input.latitude, input.longitude),
    placeName: input.placeName,
    latitude: input.latitude,
    longitude: input.longitude,
    radiusMeters: SHOP_GEOFENCE_RADIUS_M,
    items: [],
  };
  if (input.item) addItem(next, input.item);
  anchors.push(next);
  return next;
}

function attachByName(anchors: PlaceAnchor[], item: Reminder): void {
  const name = item.location?.placeName;
  if (!name) return;
  const key = placeKey(name);
  const cluster = anchors.find((anchor) => placeKey(anchor.placeName) === key);
  if (cluster) addItem(cluster, item);
}

/**
 * Build shop/market anchors from open reminders and saved places.
 * Multiple items at the same shop are grouped into one geofence.
 */
export function buildPlaceAnchors(reminders: Reminder[], savedPlaces: Place[] = []): PlaceAnchor[] {
  const anchors: PlaceAnchor[] = [];
  const open = reminders.filter((item) => item.status === 'open');

  for (const item of open) {
    if (item.category !== 'onTheWayBack' && item.category !== 'specific') continue;
    const loc = item.location;
    if (!loc?.placeName?.trim()) continue;
    if (!isValidCoordinates({ latitude: loc.latitude, longitude: loc.longitude })) continue;
    upsertAnchor(anchors, {
      placeName: loc.placeName.trim(),
      latitude: loc.latitude!,
      longitude: loc.longitude!,
      item,
    });
  }

  for (const item of open) {
    if (item.category !== 'onTheWayBack' && item.category !== 'specific') continue;
    attachByName(anchors, item);
  }

  for (const place of savedPlaces) {
    if (place.type === 'home' || !place.isActive) continue;
    if (!isValidCoordinates(place)) continue;
    const hasItems = anchors.some(
      (anchor) =>
        distanceMeters(
          { latitude: place.latitude!, longitude: place.longitude! },
          { latitude: anchor.latitude, longitude: anchor.longitude },
        ) <= PLACE_CLUSTER_METERS && anchor.items.length > 0,
    );
    if (hasItems) continue;
    upsertAnchor(anchors, {
      placeName: place.name,
      latitude: place.latitude!,
      longitude: place.longitude!,
    });
  }

  return anchors
    .filter((anchor) => anchor.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length || a.placeName.localeCompare(b.placeName))
    .slice(0, MAX_GEOFENCE_REGIONS);
}

export function formatPlaceNotificationCopy(anchor: PlaceAnchor): { title: string; body: string; href: string } {
  const titles = anchor.items.map((item) => item.title);
  const body =
    titles.length === 0
      ? 'something to pick up'
      : titles.length === 1
        ? titles[0]!
        : titles.length === 2
          ? `${titles[0]} · ${titles[1]}`
          : `${titles[0]} · +${titles.length - 1} more`;
  return {
    title: anchor.placeName ? `At ${anchor.placeName}` : 'Nearby',
    body,
    href: anchor.items[0]?.href ?? '/on-the-way-back',
  };
}
