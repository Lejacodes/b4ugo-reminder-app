import {
  daysBetween,
  formatDateRange,
  formatHumanDate,
  isPastTrip,
  isUpcomingTrip,
  parseIsoDate,
  resolveTripDates,
} from '@/lib/trips/dates';

describe('daysBetween', () => {
  it('returns signed differences for past, current, and future dates', () => {
    const today = parseIsoDate('2026-10-29')!;
    expect(daysBetween(today, parseIsoDate('2026-10-27')!)).toBe(-2);
    expect(daysBetween(today, parseIsoDate('2026-10-29')!)).toBe(0);
    expect(daysBetween(today, parseIsoDate('2026-11-01')!)).toBe(3);
  });
});

describe('trip position relative to today', () => {
  const today = '2026-10-29';

  it('keeps past trips out of upcoming results', () => {
    expect(isPastTrip('2026-10-20', '2026-10-22', today)).toBe(true);
    expect(isUpcomingTrip('2026-10-20', '2026-10-22', today)).toBe(false);
  });

  it('treats a trip ending today as current, not past', () => {
    expect(isPastTrip('2026-10-27', today, today)).toBe(false);
    expect(isUpcomingTrip('2026-10-27', today, today)).toBe(true);
  });

  it('recognizes a future trip', () => {
    expect(isPastTrip('2026-11-02', '2026-11-05', today)).toBe(false);
    expect(isUpcomingTrip('2026-11-02', '2026-11-05', today)).toBe(true);
  });
});

describe('formatHumanDate', () => {
  it('formats an ISO date for people', () => {
    expect(formatHumanDate('2026-08-23')).toBe('23 Aug 2026');
  });

  it('returns null for invalid values', () => {
    expect(formatHumanDate('not-a-date')).toBeNull();
    expect(formatHumanDate('')).toBeNull();
  });
});

describe('formatDateRange', () => {
  it('shows a same-year range without repeating the year', () => {
    expect(formatDateRange('2026-09-15', '2026-09-20')).toBe('15 Sep — 20 Sep 2026');
  });

  it('keeps both years when the range crosses a year', () => {
    expect(formatDateRange('2026-12-30', '2027-01-03')).toBe('30 Dec 2026 — 3 Jan 2027');
  });

  it('labels an open start or end', () => {
    expect(formatDateRange('2026-09-15', null)).toBe('from 15 Sep 2026');
    expect(formatDateRange(null, '2026-09-20')).toBe('until 20 Sep 2026');
  });
});

describe('resolveTripDates', () => {
  it('drops an end date that is before the start', () => {
    expect(resolveTripDates({ startDate: '2026-09-20', endDate: '2026-09-15' })).toEqual({
      startDate: '2026-09-20',
      endDate: null,
      durationDays: null,
    });
  });
});
