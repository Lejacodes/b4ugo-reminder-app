export type RecordStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  migrateUserSnapshot(userId: string, keys: string[]): Promise<MigrationReceipt>;
  removeAccount(userId: string, keys: string[]): Promise<void>;
  withLock?<T>(key: string, task: () => Promise<T>): Promise<T>;
};

export type MigrationReceipt = {
  userId: string;
  imported: number;
  checksum: string;
  verifiedAt: string;
};

export function checksumSnapshot(entries: readonly (readonly [string, string])[]): string {
  let hash = 2166136261;
  for (const [key, value] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
    const input = `${key}\0${value}\0`;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
