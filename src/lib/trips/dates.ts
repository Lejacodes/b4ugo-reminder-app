/** Date helpers for trip ranges. Values are ISO dates (`YYYY-MM-DD`) or null. */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string | null | undefined): Date | null {
  const trimmed = value?.trim() ?? '';
  const match = ISO_DATE.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / 86400000);
}

export function addDays(start: Date, days: number): Date {
  const next = new Date(start.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveTripDates(input: {
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
}): { startDate: string | null; endDate: string | null; durationDays: number | null } {
  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  const duration =
    input.durationDays != null && Number.isFinite(input.durationDays) && input.durationDays > 0
      ? Math.round(input.durationDays)
      : null;

  if (start && end) {
    if (end < start) {
      return { startDate: toIsoDate(start), endDate: null, durationDays: duration };
    }
    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
      // A trip duration cannot be negative. The ordering guard above already
      // enforces this; clamp here to keep that domain rule local and explicit.
      durationDays: Math.max(0, daysBetween(start, end)) || duration,
    };
  }

  if (start && duration != null) {
    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(addDays(start, duration)),
      durationDays: duration,
    };
  }

  if (end && duration != null) {
    return {
      startDate: toIsoDate(addDays(end, -duration)),
      endDate: toIsoDate(end),
      durationDays: duration,
    };
  }

  return {
    startDate: start ? toIsoDate(start) : null,
    endDate: end ? toIsoDate(end) : null,
    durationDays: duration,
  };
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatHumanDate(value: string | null | undefined): string | null {
  const date = parseIsoDate(value);
  if (!date) return null;
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (start && end) {
    const startDay = `${start.getUTCDate()} ${MONTHS_SHORT[start.getUTCMonth()]}`;
    const endDay = `${end.getUTCDate()} ${MONTHS_SHORT[end.getUTCMonth()]}`;
    if (start.getUTCFullYear() === end.getUTCFullYear()) {
      return `${startDay} — ${endDay} ${end.getUTCFullYear()}`;
    }
    return `${startDay} ${start.getUTCFullYear()} — ${endDay} ${end.getUTCFullYear()}`;
  }
  if (startDate) {
    const label = formatHumanDate(startDate);
    return label ? `from ${label}` : null;
  }
  if (endDate) {
    const label = formatHumanDate(endDate);
    return label ? `until ${label}` : null;
  }
  return null;
}

export function formatDuration(days: number | null): string | null {
  if (days == null || days <= 0) return null;
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function inferSeason(startDate: string | null): string | null {
  const date = parseIsoDate(startDate);
  if (!date) return null;
  const month = date.getUTCMonth() + 1;
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

export function isUpcomingTrip(
  startDate: string | null,
  endDate: string | null,
  currentDate = todayIso(),
): boolean {
  const today = parseIsoDate(currentDate);
  if (!today) return true;
  const end = parseIsoDate(endDate);
  if (end) return end >= today;
  const start = parseIsoDate(startDate);
  if (start) return start >= today;
  return true;
}

export function isPastTrip(
  startDate: string | null,
  endDate: string | null,
  currentDate = todayIso(),
): boolean {
  const today = parseIsoDate(currentDate);
  if (!today) return false;
  const end = parseIsoDate(endDate);
  if (end) return end < today;
  const start = parseIsoDate(startDate);
  if (start) return start < today;
  return false;
}
