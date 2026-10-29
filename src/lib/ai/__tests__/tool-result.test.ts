import {
  composeVerifiedReply,
  creationResult,
  deletionResult,
  formatVerifiedMutation,
  isEmptyDestructive,
  NO_CHECKED_ITEMS_MESSAGE,
  verifiedCreationResult,
} from '@/lib/ai/tool-result';

describe('tool mutation results', () => {
  it('requires an explicit successful creation result with a display name', () => {
    expect(creationResult(' Antalya ')).toEqual({ success: true, displayName: 'Antalya' });
    expect(verifiedCreationResult('createTrip', { title: 'Antalya' })).toEqual({ success: false });
    expect(verifiedCreationResult('createTrip', creationResult('Antalya'))).toEqual({
      success: true,
      displayName: 'Antalya',
    });
  });

  it('returns a truthful deletion count', () => {
    expect(deletionResult(3)).toEqual({ success: true, deletedCount: 3 });
    expect(formatVerifiedMutation('deleteReminder', deletionResult(3))).toBe('removed 3 ♡');
    expect(formatVerifiedMutation('deleteReminder', deletionResult(1))).toBe('removed it ♡');
  });

  it('never claims a delete when nothing was removed', () => {
    expect(deletionResult(0)).toEqual({ success: false, deletedCount: 0 });
    expect(formatVerifiedMutation('deleteReminder', deletionResult(0))).toBe(NO_CHECKED_ITEMS_MESSAGE);
    expect(formatVerifiedMutation('completeAllReminders', { success: false, deletedCount: 0, completed: 0 })).toBe(
      NO_CHECKED_ITEMS_MESSAGE,
    );
    expect(formatVerifiedMutation('removePackingItem', { success: false, deletedCount: 0 })).toBe(
      NO_CHECKED_ITEMS_MESSAGE,
    );
    expect(
      isEmptyDestructive({ name: 'deleteReminder', payload: { success: false, deletedCount: 0 } }),
    ).toBe(true);
  });

  it('drops a model success claim when the tool removed nothing', () => {
    const message = composeVerifiedReply(
      'removed them all!',
      [{ name: 'deleteReminder', payload: { success: false, deletedCount: 0 } }],
      (name, payload) => formatVerifiedMutation(name, payload) ?? '',
      'okay.',
    );
    expect(message).toBe(NO_CHECKED_ITEMS_MESSAGE);
  });
});
