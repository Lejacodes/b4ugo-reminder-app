/** Durable local record/outbox commit. Transport never owns application state. */
export type SyncRecord = {
  collection: string;
  id: string;
  value: unknown;
  version: number;
  deleted: boolean;
};
export type Operation = SyncRecord & {
  operationId: string;
  baseVersion: number;
  attempts: number;
  nextAttemptAt: number;
  error?: string;
  conflict?: SyncRecord;
};
type State = { format: 1; records: Record<string, SyncRecord>; outbox: Operation[]; imported: string[]; recovered: number; device?: Record<string, unknown> };
export type SyncSummary = { pending: number; failed: number; conflicts: number; recovered: number };
export type DurableStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; withLock?<T>(key: string, task: () => Promise<T>): Promise<T> };
export type SyncTransport = {
  apply(userId: string, operation: Operation): Promise<{ record: SyncRecord; conflict: boolean }>;
  pull(userId: string): Promise<SyncRecord[]>;
};
const keyOf = (collection: string, id: string) => JSON.stringify([collection, id]);
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right)));
    }
    return item;
  });
}
const empty = (): State => ({ format: 1, records: {}, outbox: [], imported: [], recovered: 0 });
let sequence = 0;
const operationId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${++sequence}`;

export class LocalRepository {
  private tails = new Map<string, Promise<unknown>>();
  private stopped = new Set<string>();
  constructor(private storage: DurableStorage, private notify: (userId: string) => void = () => {}) {}

  private async read(userId: string): Promise<State> {
    const raw = await this.storage.getItem(`blugo.sync.v1.${userId}`);
    if (!raw) return empty();
    const state = JSON.parse(raw) as State;
    if (state.format !== 1 || !state.records || !Array.isArray(state.outbox) || !Array.isArray(state.imported)) {
      throw new Error('Local records need recovery. The original data has been retained.');
    }
    return state;
  }

  private serial<T>(userId: string, task: () => Promise<T>): Promise<T> {
    const next = (this.tails.get(userId) ?? Promise.resolve()).catch(() => {}).then(() =>
      {
        if (this.stopped.has(userId)) throw new Error('This account is no longer available');
        return this.storage.withLock ? this.storage.withLock(userId, task) : task();
      });
    this.tails.set(userId, next);
    return next;
  }

  async stopAccount(userId: string) {
    this.stopped.add(userId);
    await this.tails.get(userId)?.catch(() => {});
  }

  private async commit(userId: string, state: State) {
    const key = `blugo.sync.v1.${userId}`;
    const raw = JSON.stringify(state);
    if (await this.storage.getItem(key) === raw) return;
    await this.storage.setItem(key, raw);
    this.notify(userId);
  }

  /** Import once; a failed/corrupt read never marks the source imported. */
  import(userId: string, collection: string, values: { id: string; value: unknown }[]) {
    return this.serial(userId, async () => {
      const state = await this.read(userId);
      if (state.imported.includes(collection)) return;
      for (const item of values) {
        const key = keyOf(collection, item.id);
        if (!state.records[key]) this.enqueue(state, collection, item.id, item.value, false);
      }
      state.imported.push(collection);
      await this.commit(userId, state);
    });
  }

  private enqueue(state: State, collection: string, id: string, value: unknown, deleted: boolean) {
    const key = keyOf(collection, id);
    const current = state.records[key];
    if (current && current.deleted === deleted && canonical(current.value) === canonical(value)) return;
    const baseVersion = current?.version ?? 0;
    const record = { collection, id, value, deleted, version: baseVersion + 1 };
    state.records[key] = record;
    state.outbox.push({ ...record, baseVersion, operationId: operationId(), attempts: 0, nextAttemptAt: 0 });
  }

  async list<T>(userId: string, collection: string): Promise<T[]> {
    const state = await this.read(userId);
    return Object.values(state.records).filter((row) => row.collection === collection && !row.deleted).map((row) => row.value as T);
  }

  async hasHistory(userId: string, collection: string): Promise<boolean> {
    return Object.values((await this.read(userId)).records).some((record) => record.collection === collection);
  }

  async readDevice<T>(userId: string, key: string): Promise<T | undefined> {
    return (await this.read(userId)).device?.[key] as T | undefined;
  }

  importDevice(userId: string, key: string, value: unknown) {
    return this.serial(userId, async () => {
      const state = await this.read(userId);
      if (state.device && key in state.device) return;
      state.device = { ...state.device, [key]: value };
      await this.commit(userId, state);
    });
  }

  /** Only an explicitly supplied baseline may generate tombstones. Remote absence never deletes. */
  write(userId: string, changes: { collection: string; before: { id: string; value: unknown }[]; after: { id: string; value: unknown }[] }[], device?: Record<string, unknown>) {
    return this.serial(userId, async () => {
      const state = await this.read(userId);
      for (const { collection, before, after } of changes) {
        const next = new Map(after.map((item) => [item.id, item.value]));
        const previous = new Map(before.map((item) => [item.id, item.value]));
        for (const [id, value] of next) {
          if (!previous.has(id) || canonical(previous.get(id)) !== canonical(value)) {
            const current = state.records[keyOf(collection, id)];
            if (current && previous.has(id) && canonical(current.value) !== canonical(previous.get(id))) {
              throw new Error('This item changed. Review the latest version before saving again.');
            }
            this.enqueue(state, collection, id, value, false);
          }
        }
        for (const [id, value] of previous) {
          if (!next.has(id)) {
            const current = state.records[keyOf(collection, id)];
            if (current && canonical(current.value) !== canonical(value)) throw new Error('This item changed before deletion.');
            this.enqueue(state, collection, id, null, true);
          }
        }
      }
      if (device) state.device = { ...state.device, ...device };
      await this.commit(userId, state);
    });
  }

  async summary(userId: string): Promise<SyncSummary> {
    const state = await this.read(userId);
    return { pending: state.outbox.length, failed: state.outbox.filter((op) => op.error).length,
      conflicts: state.outbox.filter((op) => op.conflict).length, recovered: state.recovered };
  }

  async conflicts(userId: string) {
    return (await this.read(userId)).outbox.filter((op) => op.conflict);
  }

  /** Explicit user choice keeps the remote version; pending local operations remain in recovery storage. */
  resolveWithRemote(userId: string, operationId: string) {
    return this.serial(userId, async () => {
      const state = await this.read(userId);
      const operation = state.outbox.find((op) => op.operationId === operationId);
      if (!operation?.conflict) return;
      await this.storage.setItem(`blugo.sync.recovery.${userId}.${operationId}`, JSON.stringify(state));
      const key = keyOf(operation.collection, operation.id);
      state.records[key] = operation.conflict;
      state.outbox = state.outbox.filter((op) => keyOf(op.collection, op.id) !== key);
      await this.commit(userId, state);
    });
  }

  async synchronize(userId: string, transport: SyncTransport, isCurrent: () => boolean, now = Date.now()) {
    // Network requests run outside the commit lock, so offline editing stays responsive.
    const operations = (await this.read(userId)).outbox;
    const blocked = new Set<string>();
    let attempted = 0;
    let failures = 0;
    for (const operation of operations) {
      if (!isCurrent()) return;
      const key = keyOf(operation.collection, operation.id);
      if (blocked.has(key)) continue;
      if (operation.conflict || operation.nextAttemptAt > now) { blocked.add(key); continue; }
      if (attempted >= 50 || failures >= 3) break;
      attempted += 1;
      try {
        const result = await transport.apply(userId, operation);
        if (!isCurrent()) return;
        await this.serial(userId, async () => {
          const state = await this.read(userId);
          const pending = state.outbox.find((op) => op.operationId === operation.operationId);
          if (!pending) return;
          if (result.conflict && !(result.record.deleted === pending.deleted && canonical(result.record.value) === canonical(pending.value))) {
            pending.conflict = result.record;
            pending.error = 'Another device changed this item. Review in diagnostics.';
            blocked.add(key);
          } else {
            state.outbox = state.outbox.filter((op) => op.operationId !== operation.operationId);
            if (pending.attempts > 0) state.recovered += 1;
          }
          await this.commit(userId, state);
        });
      } catch {
        failures += 1;
        blocked.add(key);
        if (!isCurrent()) return;
        await this.serial(userId, async () => {
          const state = await this.read(userId);
          const pending = state.outbox.find((op) => op.operationId === operation.operationId);
          if (pending) {
            pending.attempts += 1;
            pending.error = 'Sync unavailable. Saved on this device; retry scheduled.';
            pending.nextAttemptAt = now + Math.min(300_000, 1000 * 2 ** Math.min(pending.attempts, 8));
            await this.commit(userId, state);
          }
        });
      }
    }
    if (!isCurrent()) return;
    const remote = await transport.pull(userId);
    if (!isCurrent()) return;
    await this.serial(userId, async () => {
      const state = await this.read(userId);
      for (const record of remote) {
        const key = keyOf(record.collection, record.id);
        if (state.outbox.some((op) => keyOf(op.collection, op.id) === key)) continue;
        if (!state.records[key] || record.version > state.records[key].version) state.records[key] = record;
      }
      await this.commit(userId, state);
    });
  }
}
