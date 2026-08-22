import { formatDateRange, formatHumanDate, resolveTripDates } from '@/lib/trips/dates';

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
