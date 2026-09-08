/**
 * Proactive weather rules for the daily Before U Go board.
 *
 * Live Open-Meteo snapshots only. Never invents rain, cold, or UV.
 */
import type { WeatherSnapshot } from '@/lib/engines/contracts';

export const PRECIP_INJECT_THRESHOLD = 40;
export const COLD_THRESHOLD_C = 10;
export const HEAT_THRESHOLD_C = 26;
export const HIGH_UV_INDEX = 6;

export type WeatherRule = 'rain' | 'cold' | 'heat';

export type WeatherBadgeIcon = 'rain' | 'cold' | 'sun' | 'weather';

export type WeatherInjection = {
  id: string;
  title: string;
  badge: string;
  badgeIcon: WeatherBadgeIcon;
  reason: string;
  rule: WeatherRule;
};

export function precipitationChance(weather: WeatherSnapshot): number | null {
  if (weather.precipitationProbability != null) return weather.precipitationProbability;
  return weather.rainLikely ? 100 : null;
}

export function rainExpected(weather: WeatherSnapshot): boolean {
  if (weather.rainLikely) return true;
  const chance = precipitationChance(weather);
  return chance != null && chance > PRECIP_INJECT_THRESHOLD;
}

export function weatherStatusPhrase(weather: WeatherSnapshot | null): string | null {
  if (!weather) return null;
  const temp = weather.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : null;
  const rain = rainExpected(weather) ? 'Rain Expected' : null;
  const parts = [temp, rain].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return weather.summary?.trim() || null;
}

export function weatherInjections(weather: WeatherSnapshot | null): WeatherInjection[] {
  if (!weather?.isLive) return [];

  const out: WeatherInjection[] = [];
  const chance = precipitationChance(weather);
  const temp = weather.temperatureC;
  const uv = weather.uvIndex;

  if (rainExpected(weather)) {
    if (chance != null && chance > 70) {
      out.push({
        id: 'raincoat',
        title: 'Raincoat',
        badge: 'Rain Expected',
        badgeIcon: 'rain',
        reason: 'heavy rain expected today',
        rule: 'rain',
      });
    } else {
      out.push({
        id: 'umbrella',
        title: 'Umbrella',
        badge: 'Rain Expected',
        badgeIcon: 'rain',
        reason: 'rain expected today',
        rule: 'rain',
      });
    }
  }

  if (temp != null && temp < COLD_THRESHOLD_C) {
    if (temp < 5) {
      out.push({
        id: 'coat',
        title: 'Coat',
        badge: 'Cold',
        badgeIcon: 'cold',
        reason: 'it will be cold',
        rule: 'cold',
      });
    } else {
      out.push({
        id: 'warm-layers',
        title: 'Warm Layers',
        badge: 'Cold',
        badgeIcon: 'cold',
        reason: 'it will be chilly',
        rule: 'cold',
      });
    }
  }

  const hot = temp != null && temp > HEAT_THRESHOLD_C;
  const highUv = uv != null && uv >= HIGH_UV_INDEX;
  if (highUv) {
    out.push({
      id: 'sunglasses',
      title: 'Sunglasses',
      badge: hot ? 'Hot Day' : 'High UV',
      badgeIcon: 'sun',
      reason: highUv && hot ? 'hot day with high UV' : 'UV is high today',
      rule: 'heat',
    });
  }
  if (hot) {
    out.push({
        id: 'water-bottle',
        title: 'Water Bottle',
      badge: 'Hot Day',
      badgeIcon: 'sun',
      reason: 'it will be hot',
      rule: 'heat',
    });
  }

  return out;
}

export function weatherKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, '-');
}

export function weatherBadgeForText(title: string, reason?: string | null, source?: string | null): string | null {
  return weatherBadgeMeta(title, reason, source)?.label ?? null;
}

export function weatherBadgeIconForText(
  title: string,
  reason?: string | null,
  source?: string | null,
): WeatherBadgeIcon | null {
  return weatherBadgeMeta(title, reason, source)?.icon ?? null;
}

function weatherBadgeMeta(
  title: string,
  reason?: string | null,
  source?: string | null,
): { label: string; icon: WeatherBadgeIcon } | null {
  const hay = `${title} ${reason ?? ''}`.toLowerCase();
  if (source === 'weather' || /rain|cold|chilly|hot|uv|sun/.test(hay)) {
    if (/rain|umbrella|raincoat/.test(hay)) return { label: 'Rain Expected', icon: 'rain' };
    if (/cold|chilly|coat|jacket|layer/.test(hay)) return { label: 'Cold', icon: 'cold' };
    if (/hot|uv|sun|water|sunscreen/.test(hay)) return { label: 'Hot Day', icon: 'sun' };
    if (source === 'weather') return { label: 'Weather', icon: 'weather' };
  }
  return null;
}
