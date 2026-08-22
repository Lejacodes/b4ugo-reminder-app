/**
 * Weather service.
 *
 * Open-Meteo is used when coordinates are available. Without a location,
 * this returns null — it does not invent rain.
 */
import type { WeatherQuery, WeatherService, WeatherSnapshot } from './contracts';
import { liveWeatherService } from '@/lib/weather/open-meteo';

export class LocalWeatherService implements WeatherService {
  async getSnapshot(_query?: WeatherQuery): Promise<WeatherSnapshot | null> {
    return null;
  }
}

export const weatherService: WeatherService = liveWeatherService;
