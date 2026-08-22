import { ProximityTracker } from '@/lib/location/proximity';

describe('proximity tracker', () => {
  test('leaving home only fires on the inside-to-outside transition', () => {
    const tracker = new ProximityTracker();
    const home = { id: 'home', name: 'Home', latitude: 41.0082, longitude: 28.9784 };
    const inside = { latitude: 41.0082, longitude: 28.9784 };
    const outside = { latitude: 41.02, longitude: 29.0 };

    expect(tracker.evaluate({ current: outside, home, places: [] })).toEqual([]);
    expect(tracker.evaluate({ current: inside, home, places: [] })).toEqual([]);
    const left = tracker.evaluate({ current: outside, home, places: [], now: Date.now() + 1000 });
    expect(left.map((event) => event.type)).toEqual(['leftHome']);
  });

  test('entered place does not retrigger while still inside', () => {
    const tracker = new ProximityTracker();
    const petzone = { id: 'pz', name: 'PetZone', latitude: 41.01, longitude: 28.98 };
    const here = { latitude: 41.01, longitude: 28.98 };

    const first = tracker.evaluate({ current: here, home: null, places: [petzone] });
    const second = tracker.evaluate({ current: here, home: null, places: [petzone] });
    expect(first.map((event) => event.type)).toEqual(['enteredPlace']);
    expect(second).toEqual([]);
  });

  test('leaving a saved place emits leftPlace', () => {
    const tracker = new ProximityTracker();
    const petzone = { id: 'pz', name: 'PetZone', latitude: 41.01, longitude: 28.98 };
    const here = { latitude: 41.01, longitude: 28.98 };
    const away = { latitude: 41.04, longitude: 29.03 };

    tracker.evaluate({ current: here, home: null, places: [petzone] });
    const left = tracker.evaluate({ current: away, home: null, places: [petzone] });
    expect(left.map((event) => event.type)).toEqual(['leftPlace']);
  });

  test('malformed location does not crash', () => {
    const tracker = new ProximityTracker();
    expect(
      tracker.evaluate({
        current: { latitude: Number.NaN, longitude: Number.POSITIVE_INFINITY },
        home: { id: 'home', name: 'Home', latitude: 41, longitude: 29 },
        places: [],
      }),
    ).toEqual([]);
  });
});
