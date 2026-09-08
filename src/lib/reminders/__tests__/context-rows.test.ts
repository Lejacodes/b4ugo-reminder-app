import { dropDepartureRows, isClonedNecessityRow, stripClonedNecessityRows } from '@/lib/reminders/context-rows';
import type { Reminder } from '@/types/reminder';

function reminder(partial: Partial<Reminder> & Pick<Reminder, 'id' | 'title'>): Reminder {
  return {
    category: 'beforeUgo',
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    source: 'user',
    layer: 'always',
    contextId: 'ctx-1',
    reason: null,
    location: null,
    person: null,
    dueAt: null,
    ...partial,
  };
}

describe('context rows', () => {
  it('identifies cloned necessity rows', () => {
    expect(isClonedNecessityRow(reminder({ id: 'r1', title: 'Keys' }))).toBe(true);
    expect(
      isClonedNecessityRow(reminder({ id: 'r2', title: 'Laptop', layer: 'thisTrip', contextId: 'ctx-1' })),
    ).toBe(false);
  });

  it('strips cloned always-rows and remaining extras for a departure', () => {
    const rows = [
      reminder({ id: 'r1', title: 'Keys' }),
      reminder({ id: 'r2', title: 'Laptop', layer: 'thisTrip' }),
      reminder({ id: 'r3', title: 'Milk', category: 'onTheWayBack', layer: null, contextId: null }),
    ];
    expect(stripClonedNecessityRows(rows).map((item) => item.id)).toEqual(['r2', 'r3']);
    expect(dropDepartureRows(rows, 'ctx-1').map((item) => item.id)).toEqual(['r3']);
  });
});
