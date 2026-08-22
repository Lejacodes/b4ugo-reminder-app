import { distanceMeters, isWithinRadius } from '@/lib/geo/distance';

describe('distance / proximity', () => {
  test('7. Distance/proximity calculation works', () => {
    const home = { latitude: 41.0082, longitude: 28.9784 };
    const nearby = { latitude: 41.009, longitude: 28.979 };
    const far = { latitude: 41.04, longitude: 29.03 };

    const nearMeters = distanceMeters(home, nearby);
    const farMeters = distanceMeters(home, far);

    expect(nearMeters).toBeGreaterThan(0);
    expect(nearMeters).toBeLessThan(200);
    expect(farMeters).toBeGreaterThan(1000);
    expect(isWithinRadius(home, nearby, 200)).toBe(true);
    expect(isWithinRadius(home, far, 200)).toBe(false);
  });
});
