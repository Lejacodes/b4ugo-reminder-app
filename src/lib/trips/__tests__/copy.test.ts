import { formatPackedProgress, tripIdentityTags } from '@/lib/trips/copy';

describe('formatPackedProgress', () => {
  it('uses a compact count', () => {
    expect(formatPackedProgress(0, 19)).toBe('0 / 19 packed');
  });
});

describe('tripIdentityTags', () => {
  it('joins the trip identity fields', () => {
    expect(
      tripIdentityTags({
        activity: 'beach',
        season: 'summer',
        accommodation: 'hotel',
        transportation: 'plane + car',
      }),
    ).toEqual(['beach', 'summer', 'hotel', 'plane', 'car']);
  });
});
