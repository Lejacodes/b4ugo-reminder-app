import { ensureLocalRecordsMigrated } from '@/lib/storage/preferences-storage';

/** Compatibility entry point. Unowned device snapshots are never imported. */
export async function ensureMigrated(userId: string): Promise<void> {
  await ensureLocalRecordsMigrated(userId);
}
