import { fetchJson } from '@/lib/api/http';
import type { WeatherQuery, WeatherService, WeatherSnapshot } from '@/lib/engines/contracts';

type OpenMeteoForecast = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
  };
  daily?: {
    precipitation_probability_max?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    uv_index_max?: number[];
  };
};

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

const cache = new Map<string, { at: number; value: WeatherSnapshot }>();
const CACHE_MS = 30 * 60 * 1000;

function cacheKey(query: WeatherQuery): string {
  return `${query.latitude.toFixed(2)},${query.longitude.toFixed(2)}`;
}

function rainLikely(data: OpenMeteoForecast): boolean {
  const code = data.current?.weather_code;
  if (code != null && RAIN_CODES.has(code)) return true;
  if ((data.current?.precipitation ?? 0) >= 0.2) return true;
  return (data.daily?.precipitation_probability_max?.[0] ?? 0) > 40;
}

function summary(data: OpenMeteoForecast, raining: boolean): string {
  const temp = data.current?.temperature_2m;
  const parts = [temp != null ? `${Math.round(temp)}°` : null, raining ? 'Rain Expected' : null].filter(
    Boolean,
  );
  return parts.join(' · ') || 'forecast in';
}

export class OpenMeteoWeatherService implements WeatherService {
  async getSnapshot(query?: WeatherQuery): Promise<WeatherSnapshot | null> {
    if (!query) return null;

    const key = cacheKey(query);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=' +
      encodeURIComponent(String(query.latitude)) +
      '&longitude=' +
      encodeURIComponent(String(query.longitude)) +
      '&current=temperature_2m,weather_code,precipitation' +
      '&daily=precipitation_probability_max,temperature_2m_min,temperature_2m_max,uv_index_max' +
      '&forecast_days=1&timezone=auto';

    const data = await fetchJson<OpenMeteoForecast>(url);
    if (!data) return null;

    const raining = rainLikely(data);
    const snapshot: WeatherSnapshot = {
      isLive: true,
      rainLikely: raining,
      temperatureC: data.current?.temperature_2m ?? null,
      summary: summary(data, raining),
      precipitationProbability: data.daily?.precipitation_probability_max?.[0] ?? null,
      uvIndex: data.daily?.uv_index_max?.[0] ?? null,
    };
    cache.set(key, { at: Date.now(), value: snapshot });
    return snapshot;
  }
}

export const liveWeatherService = new OpenMeteoWeatherService();
