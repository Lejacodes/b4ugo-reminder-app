export function formatPackedProgress(packed: number, total: number): string {
  if (total <= 0) return 'nothing yet';
  return `${packed} of ${total} packed`;
}

export function formatRemaining(packed: number, total: number): string {
  const left = Math.max(0, total - packed);
  if (total <= 0) return 'add something';
  if (left === 0) return 'packed';
  if (left === 1) return '1 thing left';
  return `${left} things left`;
}
