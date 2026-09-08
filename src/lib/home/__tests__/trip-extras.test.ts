import { uniqueTripExtraDrafts } from '@/lib/home/trip-extras';

describe('trip extras', () => {
  it('never clones personal necessity titles into reminder drafts', () => {
    const drafts = uniqueTripExtraDrafts({
      necessityTitles: ['Keys', 'Phone'],
      pack: [
        { title: 'Keys' },
        { title: 'Laptop' },
      ],
      suggestions: [{ title: 'Umbrella', reason: 'rain expected today', source: 'weather' }],
      destination: 'Uni',
    });

    expect(drafts.map((item) => item.title)).toEqual(['Laptop', 'Umbrella']);
    expect(drafts.every((item) => item.layer !== 'always')).toBe(true);
  });

  it('does not clone titles already on the trip packing list', () => {
    const drafts = uniqueTripExtraDrafts({
      necessityTitles: [],
      packingTitles: ['Passport'],
      pack: [{ title: 'Passport' }, { title: 'Laptop' }],
      suggestions: [],
      destination: 'Antalya',
    });
    expect(drafts.map((item) => item.title)).toEqual(['Laptop']);
  });
});
