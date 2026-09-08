import { buildContextStatus, timeWindowLabel } from '@/lib/home/context-status';

describe('context status', () => {
  it('names an active departure and weather', () => {
    expect(
      buildContextStatus({
        now: new Date('2026-09-07T08:00:00'),
        destination: 'Uni',
        weather: {
          isLive: true,
          rainLikely: true,
          temperatureC: 18,
          summary: '18° · Rain Expected',
        },
        atHome: true,
      }),
    ).toBe('Leaving for Uni • 18°C Rain Expected');
  });

  it('uses a quiet evening line when staying home', () => {
    expect(
      buildContextStatus({
        now: new Date('2026-09-07T20:00:00'),
        destination: null,
        weather: null,
        atHome: true,
      }),
    ).toBe('At Home • Quiet Evening');
  });

  it('labels morning and night windows', () => {
    expect(timeWindowLabel(new Date('2026-09-07T07:00:00'))).toBe('Morning');
    expect(timeWindowLabel(new Date('2026-09-07T23:00:00'))).toBe('Quiet Night');
  });
});
