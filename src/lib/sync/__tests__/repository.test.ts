import { LocalRepository, type DurableStorage, type Operation, type SyncRecord, type SyncTransport } from '../repository';

function storage() {
  const data = new Map<string, string>();
  let fail = false;
  const adapter: DurableStorage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { if (fail) throw new Error('disk full'); data.set(key, value); },
  };
  return { adapter, data, fail: (value: boolean) => { fail = value; } };
}
const item = (id: string, title: string) => ({ id, value: { id, title } });
function server() {
  const records = new Map<string, SyncRecord>();
  const receipts = new Map<string, { record: SyncRecord; conflict: boolean }>();
  const key = (user: string, op: { collection: string; id: string }) => `${user}:${op.collection}:${op.id}`;
  const transport: SyncTransport = {
    apply: async (user, op) => {
      const receiptKey = `${user}:${op.operationId}`;
      const receipt = receipts.get(receiptKey);
      if (receipt) return receipt;
      const current = records.get(key(user, op));
      if ((current?.version ?? 0) !== op.baseVersion) return { record: current!, conflict: true };
      const record = { collection: op.collection, id: op.id, value: op.value, deleted: op.deleted, version: op.baseVersion + 1 };
      records.set(key(user, op), record);
      const result = { record, conflict: false };
      receipts.set(receiptKey, result);
      return result;
    },
    pull: async (user) => [...records.entries()].filter(([key]) => key.startsWith(`${user}:`)).map(([, row]) => row),
  };
  return { transport, records };
}

describe('durable repository and outbox integration', () => {
  it('reloads an offline write and its outbox after repository restart', async () => {
    const disk = storage();
    await new LocalRepository(disk.adapter).write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }]);
    const restarted = new LocalRepository(disk.adapter);
    expect(await restarted.list('a', 'reminders')).toEqual([{ id: 'one', title: 'Keys' }]);
    expect((await restarted.summary('a')).pending).toBe(1);
  });

  it('commits records and outbox together and rejects storage failures', async () => {
    const disk = storage();
    const repo = new LocalRepository(disk.adapter);
    disk.fail(true);
    await expect(repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }])).rejects.toThrow('disk full');
    disk.fail(false);
    expect(await repo.list('a', 'reminders')).toEqual([]);
    expect((await repo.summary('a')).pending).toBe(0);
  });

  it('imports large snapshots exactly once and preserves all records', async () => {
    const disk = storage();
    const repo = new LocalRepository(disk.adapter);
    const snapshot = Array.from({ length: 1500 }, (_, index) => item(String(index), `Item ${index}`));
    await repo.import('a', 'reminders', snapshot);
    await new LocalRepository(disk.adapter).import('a', 'reminders', snapshot);
    expect(await repo.list('a', 'reminders')).toHaveLength(1500);
    expect((await repo.summary('a')).pending).toBe(1500);
  });

  it('retains corrupt data and refuses to overwrite it', async () => {
    const disk = storage();
    disk.data.set('blugo.sync.v1.a', '{broken');
    const repo = new LocalRepository(disk.adapter);
    await expect(repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }])).rejects.toThrow();
    expect(disk.data.get('blugo.sync.v1.a')).toBe('{broken');
  });

  it('retries offline operations after restart and reports recovery', async () => {
    const disk = storage();
    const repo = new LocalRepository(disk.adapter);
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }]);
    const backend = server();
    await repo.synchronize('a', { ...backend.transport, apply: async () => { throw new Error('offline'); } }, () => true, 1000);
    expect((await repo.summary('a')).failed).toBe(1);
    const restarted = new LocalRepository(disk.adapter);
    await restarted.synchronize('a', backend.transport, () => true, 5000);
    expect(await restarted.summary('a')).toEqual({ pending: 0, failed: 0, conflicts: 0, recovered: 1 });
  });

  it.each([['a', 'b'], ['b', 'a']])('preserves independent offline records when %s reconnects before %s', async (first, second) => {
    const devices = { a: new LocalRepository(storage().adapter), b: new LocalRepository(storage().adapter) };
    const backend = server();
    for (const name of ['a', 'b'] as const) await devices[name].write('owner', [{ collection: 'reminders', before: [], after: [item(name, name)] }]);
    await devices[first as 'a' | 'b'].synchronize('owner', backend.transport, () => true);
    await devices[second as 'a' | 'b'].synchronize('owner', backend.transport, () => true);
    await devices[first as 'a' | 'b'].synchronize('owner', backend.transport, () => true);
    expect(await devices.a.list('owner', 'reminders')).toHaveLength(2);
    expect(await devices.b.list('owner', 'reminders')).toHaveLength(2);
  });

  it('retains stale edits as conflicts instead of overwriting another device', async () => {
    const backend = server();
    const a = new LocalRepository(storage().adapter);
    const b = new LocalRepository(storage().adapter);
    await a.write('owner', [{ collection: 'reminders', before: [], after: [item('one', 'Original')] }]);
    await a.synchronize('owner', backend.transport, () => true);
    await b.synchronize('owner', backend.transport, () => true);
    await a.write('owner', [{ collection: 'reminders', before: [item('one', 'Original')], after: [item('one', 'A')] }]);
    await b.write('owner', [{ collection: 'reminders', before: [item('one', 'Original')], after: [item('one', 'B')] }]);
    await a.synchronize('owner', backend.transport, () => true);
    await b.synchronize('owner', backend.transport, () => true);
    expect((await b.summary('owner')).conflicts).toBe(1);
    expect(await b.list('owner', 'reminders')).toEqual([{ id: 'one', title: 'B' }]);
    const [conflict] = await b.conflicts('owner');
    await b.resolveWithRemote('owner', conflict.operationId);
    expect(await b.list('owner', 'reminders')).toEqual([{ id: 'one', title: 'A' }]);
  });

  it('does not infer deletions from missing remote records', async () => {
    const repo = new LocalRepository(storage().adapter);
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }]);
    const backend = server();
    await repo.synchronize('a', { ...backend.transport, pull: async () => [] }, () => true);
    expect(await repo.list('a', 'reminders')).toHaveLength(1);
  });

  it('retries an accepted operation with the same operation id after a lost response', async () => {
    const repo = new LocalRepository(storage().adapter);
    const backend = server();
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }]);
    const seen: Operation[] = [];
    await repo.synchronize('a', { ...backend.transport, apply: async (user, op) => {
      seen.push(op); await backend.transport.apply(user, op); throw new Error('response lost');
    } }, () => true, 1000);
    await repo.synchronize('a', { ...backend.transport, apply: async (user, op) => {
      seen.push(op); return backend.transport.apply(user, op);
    } }, () => true, 5000);
    expect(seen[0].operationId).toBe(seen[1].operationId);
    expect((await repo.summary('a')).pending).toBe(0);
    expect(backend.records.size).toBe(1);
  });

  it('fences an account change during an in-flight response', async () => {
    const repo = new LocalRepository(storage().adapter);
    const backend = server();
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Private')] }]);
    let active = true;
    await repo.synchronize('a', { ...backend.transport, apply: async (user, op) => {
      const result = await backend.transport.apply(user, op); active = false; return result;
    } }, () => active);
    expect((await repo.summary('a')).pending).toBe(1);
    expect(await repo.list('b', 'reminders')).toEqual([]);
  });

  it('rejects a stale in-process edit and preserves the latest value', async () => {
    const repo = new LocalRepository(storage().adapter);
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Latest')] }]);
    await expect(repo.write('a', [{ collection: 'reminders', before: [item('one', 'Old')], after: [item('one', 'Stale')] }])).rejects.toThrow('changed');
    expect(await repo.list('a', 'reminders')).toEqual([{ id: 'one', title: 'Latest' }]);
  });

  it('does not create false changes when JSON object key order differs', async () => {
    const repo = new LocalRepository(storage().adapter);
    await repo.write('a', [{ collection: 'reminders', before: [], after: [item('one', 'Keys')] }]);
    await repo.write('a', [{ collection: 'reminders', before: [item('one', 'Keys')], after: [{ id: 'one', value: { title: 'Keys', id: 'one' } }] }]);
    expect((await repo.summary('a')).pending).toBe(1);
  });

  it('commits a trip and packing atomically and leaves device checks out of the outbox', async () => {
    const disk = storage();
    const repo = new LocalRepository(disk.adapter);
    disk.fail(true);
    await expect(repo.write('a', [
      { collection: 'trips', before: [], after: [item('trip', 'Trip')] },
      { collection: 'packingItems', before: [], after: [item('bag', 'Bag')] },
    ], { departureSession: { checks: { keys: true } } })).rejects.toThrow('disk full');
    disk.fail(false);
    expect(await repo.list('a', 'trips')).toEqual([]);
    expect(await repo.list('a', 'packingItems')).toEqual([]);
    expect(await repo.readDevice('a', 'departureSession')).toBeUndefined();
    await repo.write('a', [], { departureSession: { checks: { keys: true } } });
    expect((await repo.summary('a')).pending).toBe(0);
  });
});
