import { groupErrandsByPlace } from '@/lib/home/group-errands';

describe('groupErrandsByPlace', () => {
  it('groups open errands by saved place', () => {
    const groups = groupErrandsByPlace([
      { id: '1', title: 'Buy cat food', placeName: 'PetZone' },
      { id: '2', title: 'Pick up milk', placeName: 'Migros' },
      { id: '3', title: 'Treats', placeName: 'PetZone' },
    ]);

    expect(groups).toEqual([
      {
        placeName: 'PetZone',
        items: [
          { id: '1', title: 'Buy cat food' },
          { id: '3', title: 'Treats' },
        ],
      },
      { placeName: 'Migros', items: [{ id: '2', title: 'Pick up milk' }] },
    ]);
  });
});
