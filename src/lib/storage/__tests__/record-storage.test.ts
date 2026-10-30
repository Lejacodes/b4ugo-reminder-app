import { checksumSnapshot } from '../record-storage-contract';

describe('record storage migration checksum', () => {
  it('is stable regardless of key read order', () => {
    const first = checksumSnapshot([
      ['blugo.reminders.user-1', '[{"id":"one"}]'],
      ['blugo.trips.user-1', '[]'],
    ]);
    const second = checksumSnapshot([
      ['blugo.trips.user-1', '[]'],
      ['blugo.reminders.user-1', '[{"id":"one"}]'],
    ]);

    expect(first).toBe(second);
  });

  it('changes when a migrated value changes', () => {
    expect(checksumSnapshot([['key', 'before']])).not.toBe(
      checksumSnapshot([['key', 'after']]),
    );
  });
});
