import { useEffect, useState } from 'react';
import { subscribeLocalRecords } from '@/lib/sync/local';

/** Refresh provider projections after durable commits, including remote pulls. */
export function useRecordRevision(userId: string | null) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeLocalRecords((owner) => {
      if (owner !== userId) return;
      clearTimeout(timer);
      timer = setTimeout(() => setRevision((value) => value + 1), 50);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [userId]);
  return revision;
}
