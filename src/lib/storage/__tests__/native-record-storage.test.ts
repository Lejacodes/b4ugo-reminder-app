// Actual SQLite engine through a small Expo API adapter. Native bridge behavior
// remains a device test; SQL transactions and migration logic execute here.
const mockSqlite = process.getBuiltinModule('node:sqlite');
const nativeStorage = () => jest.requireActual<typeof import('../record-storage.native')>('../record-storage.native');
const mockDatabase = new mockSqlite.DatabaseSync(':memory:');
const mockLegacy = new Map<string, string>();
let mockFailWriteAt = -1;
let mockWrites = 0;
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'after-first-unlock',
  getItemAsync: jest.fn(async (key: string) => mockLegacy.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string) => { mockLegacy.delete(key); }),
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const adapter = {
      execAsync: async (sql: string) => { mockDatabase.exec(sql); },
      runAsync: async (sql: string, ...values: unknown[]) => {
        if (++mockWrites === mockFailWriteAt) throw new Error('interrupted write');
        return mockDatabase.prepare(sql).run(...values);
      },
      getFirstAsync: async (sql: string, ...values: unknown[]) => mockDatabase.prepare(sql).get(...values) ?? null,
      getAllAsync: async (sql: string, values: unknown[] = []) => mockDatabase.prepare(sql).all(...values),
      withExclusiveTransactionAsync: async (task: (tx: unknown) => Promise<void>) => {
        mockDatabase.exec('BEGIN');
        try { await task(adapter); mockDatabase.exec('COMMIT'); }
        catch (error) { mockDatabase.exec('ROLLBACK'); throw error; }
      },
    };
    return adapter;
  },
}));

describe('native record storage migration with SQLite', () => {
  afterAll(() => mockDatabase.close());
  it('rolls back an interrupted migration, retries it, and preserves legacy recovery evidence', async () => {
    const { recordStorage } = nativeStorage();
    const keys = ['blugo.reminders.a', 'blugo.trips.a'];
    mockLegacy.set(keys[0], '[{"id":"one","title":"Keys"}]');
    mockLegacy.set(keys[1], '[{"id":"trip-one"}]');
    mockFailWriteAt = 2;
    await expect(recordStorage.migrateUserSnapshot('a', keys)).rejects.toThrow('interrupted');
    expect(mockDatabase.prepare('select * from local_records').all()).toEqual([]);
    expect(mockDatabase.prepare('select * from local_migrations').all()).toEqual([]);
    mockFailWriteAt = -1;
    const receipt = await recordStorage.migrateUserSnapshot('a', keys);
    expect(receipt.imported).toBe(2);
    expect(await recordStorage.getItem(keys[0])).toBe(mockLegacy.get(keys[0]));
    expect(mockLegacy.size).toBe(2);
    const repeated = await recordStorage.migrateUserSnapshot('a', keys);
    expect(repeated).toEqual(receipt);
    expect(mockDatabase.prepare('select * from local_records').all()).toHaveLength(2);
  });

  it('never imports one account’s keys into another', async () => {
    const { recordStorage } = nativeStorage();
    const receipt = await recordStorage.migrateUserSnapshot('b', ['blugo.reminders.b', 'blugo.trips.b']);
    expect(receipt.imported).toBe(0);
    expect(await recordStorage.getItem('blugo.reminders.b')).toBeNull();
  });

  it('retains large values and reads them after module restart', async () => {
    const { recordStorage } = nativeStorage();
    const value = JSON.stringify(Array.from({ length: 5000 }, (_, id) => ({ id, title: `Reminder ${id}` })));
    await recordStorage.setItem('large.collection', value);
    jest.resetModules();
    const restarted = nativeStorage();
    expect(await restarted.recordStorage.getItem('large.collection')).toBe(value);
  });

  it('erases only the deleted account’s records and recovery snapshot', async () => {
    const { recordStorage } = nativeStorage();
    await recordStorage.setItem('blugo.sync.v1.a', '{}');
    await recordStorage.setItem('blugo.sync.recovery.a.operation', '{}');
    await recordStorage.setItem('blugo.sync.v1.b', '{"retained":true}');
    await recordStorage.removeAccount('a', ['blugo.reminders.a', 'blugo.trips.a']);
    expect(await recordStorage.getItem('blugo.sync.v1.a')).toBeNull();
    expect(await recordStorage.getItem('blugo.sync.recovery.a.operation')).toBeNull();
    expect(await recordStorage.getItem('blugo.sync.v1.b')).toBe('{"retained":true}');
    expect(mockLegacy.has('blugo.reminders.a')).toBe(false);
  });
});
