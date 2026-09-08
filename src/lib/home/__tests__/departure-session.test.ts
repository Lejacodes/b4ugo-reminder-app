import { emptyDepartureSession, normalizeDepartureSession } from '@/lib/home/departure-session';

describe('departure session', () => {
  it('resets checks when the calendar day changes', () => {
    const stale = {
      date: '2026-09-06',
      checks: { 'nec:keys': true },
      dismissed: ['umbrella'],
    };
    expect(normalizeDepartureSession(stale, '2026-09-07')).toEqual(emptyDepartureSession('2026-09-07'));
  });

  it('keeps today\'s dismissed weather choices', () => {
    const today = {
      date: '2026-09-07',
      checks: { 'wx:umbrella': true },
      dismissed: ['coat'],
    };
    expect(normalizeDepartureSession(today, '2026-09-07')).toEqual({
      ...today,
      cleared: [],
    });
  });
});
