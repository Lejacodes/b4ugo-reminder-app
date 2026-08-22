export function formatPackedProgress(packed: number, total: number): string {
  if (total <= 0) return 'nothing yet';
  return `${packed} / ${total} packed`;
}

export function tripIdentityTags(trip: {
  activity?: string | null;
  season?: string | null;
  accommodation?: string | null;
  transportation?: string | null;
}): string[] {
  return [
    trip.activity,
    trip.season,
    trip.accommodation,
    ...(trip.transportation ? trip.transportation.split(' + ') : []),
  ].filter((item): item is string => Boolean(item && item.trim()));
}

export function formatRemaining(packed: number, total: number): string {
  const left = Math.max(0, total - packed);
  if (total <= 0) return 'add something';
  if (left === 0) return 'packed';
  if (left === 1) return '1 thing left';
  return `${left} things left`;
}
