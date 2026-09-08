import { classifySmartAdd } from '@/lib/add/classify-intent';

describe('classifySmartAdd', () => {
  it('defaults to before I leave', () => {
    expect(classifySmartAdd('charger', { hasTripContext: false }).target).toBe('beforeILeave');
  });

  it('selects on the way back for place cues', () => {
    const near = classifySmartAdd('buy cat food when I am near PetZone', { hasTripContext: false });
    expect(near.target).toBe('onTheWayBack');
    expect(near.placeName?.toLowerCase()).toContain('petzone');

    const store = classifySmartAdd('pick up milk at Migros', { hasTripContext: false });
    expect(store.target).toBe('onTheWayBack');
  });

  it('selects trip only when packing language is used', () => {
    expect(classifySmartAdd('passport', { hasTripContext: true }).target).toBe('trip');
    expect(classifySmartAdd('charger', { hasTripContext: true }).target).toBe('beforeILeave');
  });

  it('still prefers a place errand over trip context', () => {
    expect(
      classifySmartAdd('grab snacks near Migros', { hasTripContext: true }).target,
    ).toBe('onTheWayBack');
  });
});
