import { checksumSnapshot, type MigrationReceipt, type RecordStorage } from './record-storage-contract';

const PREFIX = 'b4ugo.records.';

function browserStorage(): Storage | null {
  return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
}

export const recordStorage: RecordStorage = {
  async getItem(key) {
    return browserStorage()?.getItem(`${PREFIX}${key}`) ?? null;
  },
  async setItem(key, value) {
    const storage = browserStorage();
    if (!storage) throw new Error('Browser storage is unavailable. This item has not been saved.');
    storage.setItem(`${PREFIX}${key}`, value);
  },
  async removeItem(key) {
    browserStorage()?.removeItem(`${PREFIX}${key}`);
  },
  async migrateUserSnapshot(userId, keys): Promise<MigrationReceipt> {
    const entries: [string, string][] = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      if (value != null) entries.push([key, value]);
    }
    return {
      userId,
      imported: entries.length,
      checksum: checksumSnapshot(entries),
      verifiedAt: new Date().toISOString(),
    };
  },
  async removeAccount(userId, keys) {
    const storage = browserStorage();
    if (!storage) return;
    const remove: string[] = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && (keys.some((item) => key === `${PREFIX}${item}`) || key === `${PREFIX}blugo.sync.v1.${userId}` || key.startsWith(`${PREFIX}blugo.sync.recovery.${userId}.`))) remove.push(key);
    }
    for (const key of remove) storage.removeItem(key);
  },
  async withLock(key, task) {
    if (typeof navigator === 'undefined' || !navigator.locks) {
      throw new Error('This browser cannot safely save shared records. Use a current browser.');
    }
    return navigator.locks.request(`b4ugo:${key}`, task);
  },
};
