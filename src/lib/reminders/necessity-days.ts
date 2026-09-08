import type { PersonalNecessity } from '@/types/reminder';

/** Sun = 0 … Sat = 6, matching `Date.getDay()`. */
export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function isNecessityActiveOnDay(activeDays: number[] | undefined, day: number): boolean {
  if (!activeDays || activeDays.length === 0) return true;
  return activeDays.includes(day);
}

export function isNecessityActiveToday(
  necessity: Pick<PersonalNecessity, 'activeDays'>,
  dayOfWeek = new Date().getDay(),
): boolean {
  return isNecessityActiveOnDay(necessity.activeDays, dayOfWeek);
}

export function necessitiesForDay(
  necessities: PersonalNecessity[],
  dayOfWeek = new Date().getDay(),
): PersonalNecessity[] {
  return necessities.filter((item) => isNecessityActiveToday(item, dayOfWeek));
}

/** Toggle one weekday chip. Empty/undefined activeDays means every day. */
export function toggleNecessityDay(
  activeDays: number[] | undefined,
  day: number,
): number[] | undefined {
  const current =
    !activeDays || activeDays.length === 0 ? [...ALL_WEEKDAYS] : [...activeDays].sort((a, b) => a - b);
  const next = current.includes(day)
    ? current.filter((value) => value !== day)
    : [...current, day].sort((a, b) => a - b);
  if (next.length === 0 || next.length === ALL_WEEKDAYS.length) return undefined;
  return next;
}
