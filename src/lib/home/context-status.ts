import { weatherStatusPhrase } from '@/lib/context/weather-injections';
import type { WeatherSnapshot } from '@/lib/engines/contracts';

export type ContextStatusInput = {
  now: Date;
  destination: string | null;
  purpose?: string | null;
  weather: WeatherSnapshot | null;
  atHome: boolean;
};

export function timeWindowLabel(now: Date): string {
  const hour = now.getHours();
  if (hour >= 21 || hour < 5) return 'Quiet Night';
  if (hour >= 17) return 'Quiet Evening';
  if (hour >= 11) return 'Afternoon';
  return 'Morning';
}

/**
 * One glance line for Home: leaving / at home / out, plus weather when live.
 */
export function buildContextStatus(input: ContextStatusInput): string {
  const destination = input.destination?.trim() || null;
  const weatherBit = weatherStatusPhrase(input.weather);
  const window = timeWindowLabel(input.now);

  if (destination) {
    return weatherBit ? `Leaving for ${destination} • ${weatherBit}` : `Leaving for ${destination}`;
  }

  if (input.atHome) {
    return weatherBit ? `At Home • ${weatherBit}` : `At Home • ${window}`;
  }

  return weatherBit ? `Out • ${weatherBit}` : `Out • ${window}`;
}
