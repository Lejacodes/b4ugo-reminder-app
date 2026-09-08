import { buildWidgetPayload } from '@/lib/widget/export-widget-data';
import type { DepartureBoardItem } from '@/lib/home/departure-board';

function boardItem(partial: Partial<DepartureBoardItem> & Pick<DepartureBoardItem, 'id' | 'title'>): DepartureBoardItem {
  return {
    checked: false,
    kind: 'necessity',
    persistKind: 'session',
    ...partial,
  };
}

describe('widget export', () => {
  it('serializes the top four unchecked doorway items', () => {
    const payload = buildWidgetPayload([
      boardItem({ id: '1', title: 'Keys' }),
      boardItem({ id: '2', title: 'Phone', checked: true }),
      boardItem({ id: '3', title: 'Passport', kind: 'packing', persistKind: 'packing' }),
      boardItem({ id: '4', title: 'Umbrella', kind: 'weather' }),
      boardItem({ id: '5', title: 'Laptop', kind: 'reminder', persistKind: 'reminder' }),
    ]);

    expect(payload.items).toHaveLength(4);
    expect(payload.items.map((item) => item.title)).toEqual(['Keys', 'Passport', 'Umbrella', 'Laptop']);
    expect(payload.items[0]?.isPacked).toBe(false);
    expect(payload.items[0]?.icon).toBe('key');
    expect(payload.items[1]?.icon).toBe('briefcase');
    expect(payload.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
