import { planDueReminderActions } from '@/lib/notifications/due-reminders';
import { dueNotificationId } from '@/lib/notifications/routing';
import type { Reminder } from '@/types/reminder';

function reminder(partial: Partial<Reminder> & Pick<Reminder, 'id' | 'title'>): Reminder {
  return {
    category: 'specific',
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    source: 'user',
    layer: null,
    contextId: null,
    reason: null,
    location: null,
    person: null,
    dueAt: '2026-09-01T10:00:00.000Z',
    ...partial,
  };
}

const later = Date.parse('2026-08-01T00:00:00.000Z');

describe('dueAt scheduling', () => {
  test('schedules an open future reminder once', () => {
    const item = reminder({ id: 'rem-1', title: 'Call Sam' });
    const first = planDueReminderActions([item], [], later);
    expect(first).toEqual([
      expect.objectContaining({
        type: 'schedule',
        id: dueNotificationId('rem-1', item.dueAt),
        href: '/reminders',
      }),
    ]);

    const again = planDueReminderActions([item], [dueNotificationId('rem-1', item.dueAt)], later);
    expect(again).toEqual([]);
  });

  test('does not schedule completed or past reminders and cancels stale ones', () => {
    const done = reminder({ id: 'rem-2', title: 'Done', status: 'done' });
    const past = reminder({ id: 'rem-3', title: 'Past', dueAt: '2026-07-01T00:00:00.000Z' });
    const staleId = dueNotificationId('rem-2', done.dueAt);
    const actions = planDueReminderActions([done, past], [staleId], later);
    expect(actions).toEqual([{ type: 'cancel', id: staleId }]);
  });

  test('reschedules when dueAt changes', () => {
    const item = reminder({ id: 'rem-4', title: 'Move', dueAt: '2026-10-01T09:00:00.000Z' });
    const oldId = dueNotificationId('rem-4', '2026-09-01T10:00:00.000Z');
    const actions = planDueReminderActions([item], [oldId], later);
    expect(actions).toEqual(
      expect.arrayContaining([
        { type: 'cancel', id: oldId },
        expect.objectContaining({ type: 'schedule', id: dueNotificationId('rem-4', item.dueAt) }),
      ]),
    );
  });
});
