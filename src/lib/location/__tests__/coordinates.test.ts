import { isValidCoordinates } from '@/lib/location/coordinates';

describe('safe coordinates', () => {
  test('no location does not crash', () => {
    expect(isValidCoordinates(null)).toBe(false);
    expect(isValidCoordinates(undefined)).toBe(false);
    expect(isValidCoordinates({ latitude: Number.NaN, longitude: 28 })).toBe(false);
    expect(isValidCoordinates({ latitude: 41, longitude: 29 })).toBe(true);
  });
});
