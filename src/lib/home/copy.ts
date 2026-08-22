/** Copy helpers for journey counts. */

export function formatThingsWaiting(count: number): string {
  if (count <= 0) return 'nothing waiting';
  const noun = count === 1 ? 'thing' : 'things';
  return `${count} ${noun} waiting`;
}

export function formatAlongTheWay(count: number): string {
  if (count <= 0) return 'nothing along your way';
  const noun = count === 1 ? 'thing' : 'things';
  return `${count} ${noun} along your way`;
}
