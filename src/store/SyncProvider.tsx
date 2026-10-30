import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { localRepository, subscribeLocalRecords } from '@/lib/sync/local';
import { syncTransport } from '@/lib/sync/transport';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { SyncSummary } from '@/lib/sync/repository';
import { useAuth } from './AuthProvider';

type SyncState = SyncSummary & { status: 'local-only' | 'pending' | 'syncing' | 'synced' | 'failed'; refresh: () => Promise<void> };
const SyncContext = createContext<SyncState>({ pending: 0, failed: 0, conflicts: 0, recovered: 0, status: 'local-only', refresh: async () => {} });
export const useSync = () => useContext(SyncContext);
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const userId = authStatus === 'signed-in' ? user?.id ?? null : null;
  const active = useRef(userId);
  useEffect(() => {
    active.current = userId;
    return () => { active.current = null; };
  }, [userId]);
  const running = useRef(false);
  const [summary, setSummary] = useState<SyncSummary>({ pending: 0, failed: 0, conflicts: 0, recovered: 0 });
  const [status, setStatus] = useState<SyncState['status']>('local-only');
  const refresh = useCallback(async () => {
    if (!userId || running.current) return;
    running.current = true;
    const isCurrent = () => active.current === userId;
    try {
      if (isSupabaseConfigured()) {
        setStatus('syncing');
        await localRepository.synchronize(userId, syncTransport, isCurrent);
      }
      if (!isCurrent()) return;
      const next = await localRepository.summary(userId);
      setSummary(next);
      setStatus(!isSupabaseConfigured() ? 'local-only' : next.failed ? 'failed' : next.pending ? 'pending' : 'synced');
    } catch {
      if (isCurrent()) setStatus('failed');
    } finally { running.current = false; }
  }, [userId]);
  useEffect(() => {
    const initial = setTimeout(() => {
      setSummary({ pending: 0, failed: 0, conflicts: 0, recovered: 0 });
      void refresh();
    }, 0);
    const unsubscribe = subscribeLocalRecords((owner) => {
      if (owner === userId) void localRepository.summary(owner).then((next) => {
        if (active.current === owner) setSummary(next);
      }).catch(() => setStatus('failed'));
    });
    const interval = setInterval(() => void refresh(), 15_000);
    const network = NetInfo.addEventListener((state) => { if (state.isConnected) void refresh(); });
    const app = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { clearTimeout(initial); unsubscribe(); clearInterval(interval); network(); app.remove(); };
  }, [refresh, userId]);
  return <SyncContext.Provider value={{ ...summary, status, refresh }}>{children}</SyncContext.Provider>;
}
