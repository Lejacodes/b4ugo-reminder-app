import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

import { checksumSnapshot, type MigrationReceipt, type RecordStorage } from './record-storage-contract';

const DATABASE_NAME = 'b4ugo-records.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
const migrations = new Map<string, Promise<MigrationReceipt>>();

async function database(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS local_records (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS local_migrations (
          user_id TEXT PRIMARY KEY NOT NULL,
          imported_count INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          verified_at TEXT NOT NULL
        );
      `);
      return db;
    }).catch((error) => { databasePromise = null; throw error; });
  }
  return databasePromise;
}

async function migrate(userId: string, keys: string[]): Promise<MigrationReceipt> {
  const db = await database();
  const existing = await db.getFirstAsync<{
    imported_count: number;
    checksum: string;
    verified_at: string;
  }>('SELECT imported_count, checksum, verified_at FROM local_migrations WHERE user_id = ?', userId);
  if (existing) {
    return {
      userId,
      imported: existing.imported_count,
      checksum: existing.checksum,
      verifiedAt: existing.verified_at,
    };
  }

  const uniqueKeys = [...new Set(keys)];
  const legacy = (
    await Promise.all(
      uniqueKeys.map(async (key) => [key, await SecureStore.getItemAsync(key, {
        keychainService: 'blugo', keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      })] as const),
    )
  ).filter((entry): entry is readonly [string, string] => entry[1] != null);
  const checksum = checksumSnapshot(legacy);
  const verifiedAt = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const [key, value] of legacy) {
      await tx.runAsync(
        `INSERT INTO local_records (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO NOTHING`,
        key,
        value,
        verifiedAt,
      );
    }
    const imported = await tx.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value FROM local_records WHERE key IN (${uniqueKeys.map(() => '?').join(',') || "''"})`,
      uniqueKeys,
    );
    const importedLegacy = imported
      .filter((row) => legacy.some(([key]) => key === row.key))
      .map((row) => [row.key, row.value] as [string, string]);
    if (importedLegacy.length !== legacy.length || checksumSnapshot(importedLegacy) !== checksum) {
      throw new Error('Legacy record migration verification failed');
    }
    await tx.runAsync(
      'INSERT INTO local_migrations (user_id, imported_count, checksum, verified_at) VALUES (?, ?, ?, ?)',
      userId,
      legacy.length,
      checksum,
      verifiedAt,
    );
  });

  // SecureStore remains recovery evidence through Phase 1. A later, separately
  // verified cleanup may remove it after release migration evidence is captured.
  return { userId, imported: legacy.length, checksum, verifiedAt };
}

export const recordStorage: RecordStorage = {
  async getItem(key) {
    const db = await database();
    return (await db.getFirstAsync<{ value: string }>('SELECT value FROM local_records WHERE key = ?', key))
      ?.value ?? null;
  },
  async setItem(key, value) {
    const db = await database();
    await db.runAsync(
      `INSERT INTO local_records (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      new Date().toISOString(),
    );
  },
  async removeItem(key) {
    const db = await database();
    await db.runAsync('DELETE FROM local_records WHERE key = ?', key);
  },
  migrateUserSnapshot(userId, keys) {
    const active = migrations.get(userId) ?? migrate(userId, keys).catch((error) => {
      migrations.delete(userId);
      throw error;
    });
    migrations.set(userId, active);
    return active;
  },
  async removeAccount(userId, keys) {
    const db = await database();
    for (const key of keys) await SecureStore.deleteItemAsync(key, { keychainService: 'blugo' });
    await db.withExclusiveTransactionAsync(async (tx) => {
      const rows = await tx.getAllAsync<{ key: string }>('SELECT key FROM local_records');
      for (const { key } of rows) {
        if (keys.includes(key) || key === `blugo.sync.v1.${userId}` || key.startsWith(`blugo.sync.recovery.${userId}.`)) {
          await tx.runAsync('DELETE FROM local_records WHERE key = ?', key);
        }
      }
      await tx.runAsync('DELETE FROM local_migrations WHERE user_id = ?', userId);
    });
    migrations.delete(userId);
  },
};
