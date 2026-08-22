/** Copy helpers for journey counts. */

export function formatThingsWaiting(count: number): string {
  if (count <= 0) return 'nothing yet';
  const noun = count === 1 ? 'thing' : 'things';
  return `${count} ${noun} waiting`;
}

export function formatAlongTheWay(count: number): string {
  if (count <= 0) return 'nothing yet';
  return count === 1 ? '1 along your way' : `${count} along your way`;
}

export function formatTodayThings(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? '1 thing' : `${count} things`;
}

export function formatTodayWay(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? '1 along your way' : `${count} along your way`;
}
