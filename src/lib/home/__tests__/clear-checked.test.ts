import { planClearChecked } from '@/lib/home/clear-checked';
import { emptyDepartureSession } from '@/lib/home/departure-session';

describe('clear checked', () => {
  it('hides checked session rows and deletes done reminders', () => {
    const session = {
      ...emptyDepartureSession('2026-09-08'),
      checks: { 'nec:keys': true, 'nec:phone': false },
    };
    const plan = planClearChecked(
      [
        { persistKind: 'session', checked: true, id: 'nec:keys', necessityId: 'keys' },
        { persistKind: 'session', checked: false, id: 'nec:phone', necessityId: 'phone' },
        { persistKind: 'reminder', checked: true, id: 'rem-1', reminderId: 'rem-1' },
        { persistKind: 'reminder', checked: false, id: 'rem-2', reminderId: 'rem-2' },
      ],
      session,
    );

    expect(plan.nextSession.checks['nec:keys']).toBeUndefined();
    expect(plan.nextSession.cleared).toContain('nec:keys');
    expect(plan.reminderIdsToDelete).toEqual(['rem-1']);
  });

  it('leaves packed trip items on the trip instead of deleting them', () => {
    const session = emptyDepartureSession('2026-09-08');
    const plan = planClearChecked(
      [{ persistKind: 'packing', checked: true, id: 'pack:p1', packingItemId: 'p1' }],
      session,
    );
    expect(plan.reminderIdsToDelete).toEqual([]);
    expect(plan.nextSession.cleared).toEqual([]);
  });
});
