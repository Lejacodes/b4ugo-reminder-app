import { preferencesStorage } from '@/lib/storage/preferences-storage';

let identity: Promise<string> | null = null;
let generation = 0;
export const pushGeneration = () => generation;
export const invalidatePushRegistration = () => { generation += 1; };
export function installationId(): Promise<string> {
  if (!identity) identity = (async () => {
    const key = 'blugo.installation.id';
    const existing = await preferencesStorage.getItem(key);
    if (existing) return existing;
    const next = `install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    await preferencesStorage.setItem(key, next);
    return next;
  })().catch((error) => { identity = null; throw error; });
  return identity;
}
