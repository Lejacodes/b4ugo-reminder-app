/**
 * Small fetch helper for public APIs (Open-Meteo).
 * Failures resolve as null so callers can stay calm.
 */
export async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn('[blugo] request failed', response.status, url);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn('[blugo] request error', url, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
