import {
  weatherBadgeForText,
  weatherInjections,
  weatherStatusPhrase,
} from '@/lib/context/weather-injections';
import type { WeatherSnapshot } from '@/lib/engines/contracts';

function live(partial: Partial<WeatherSnapshot>): WeatherSnapshot {
  return {
    isLive: true,
    rainLikely: false,
    temperatureC: 18,
    summary: '18°',
    precipitationProbability: 10,
    uvIndex: 3,
    ...partial,
  };
}

describe('weather injections', () => {
  it('does not invent items without a live forecast', () => {
    expect(weatherInjections(null)).toEqual([]);
    expect(weatherInjections({ isLive: false, rainLikely: true, temperatureC: 4, summary: 'rain' })).toEqual([]);
  });

  it('injects an umbrella when precipitation is above 40%', () => {
    const items = weatherInjections(live({ precipitationProbability: 45, rainLikely: false }));
    expect(items.some((item) => item.title === 'Umbrella')).toBe(true);
    expect(items.find((item) => item.title === 'Umbrella')?.badge).toBe('Rain Expected');
  });

  it('injects a raincoat when rain is heavy', () => {
    const items = weatherInjections(live({ precipitationProbability: 80, rainLikely: true }));
    expect(items.map((item) => item.title)).toContain('Raincoat');
  });

  it('injects warm layers below 10°C and a coat when colder', () => {
    expect(weatherInjections(live({ temperatureC: 8 })).map((item) => item.title)).toContain('Warm Layers');
    expect(weatherInjections(live({ temperatureC: 3 })).map((item) => item.title)).toContain('Coat');
  });

  it('injects sunglasses and water on a hot or high-UV day', () => {
    const hot = weatherInjections(live({ temperatureC: 28, uvIndex: 7 }));
    expect(hot.map((item) => item.title)).toEqual(expect.arrayContaining(['Sunglasses', 'Water Bottle']));
    expect(hot.every((item) => item.badgeIcon === 'sun')).toBe(true);
  });

  it('formats a status phrase and weather badges', () => {
    expect(weatherStatusPhrase(live({ temperatureC: 18, rainLikely: true }))).toBe('18°C Rain Expected');
    expect(weatherBadgeForText('Umbrella', 'rain expected today', 'weather')).toBe('Rain Expected');
    expect(weatherBadgeForText('Coat', 'it will be cold', 'weather')).toBe('Cold');
  });
});
