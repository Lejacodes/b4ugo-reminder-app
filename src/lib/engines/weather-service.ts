/**
 * Local weather stub.
 *
 * This is NOT a weather API. It returns a fixed development snapshot so
 * suggestion rules can be exercised offline. Replace this class with a
 * real forecast client when one exists.
 */
import type { WeatherService, WeatherSnapshot } from './contracts';

const STUB: WeatherSnapshot = {
  isLive: false,
  rainLikely: true,
  temperatureC: 11,
  summary: 'Local development stub — not live weather.',
};

export class LocalWeatherService implements WeatherService {
  async getSnapshot(): Promise<WeatherSnapshot> {
    return { ...STUB };
  }
}

export const weatherService = new LocalWeatherService();
