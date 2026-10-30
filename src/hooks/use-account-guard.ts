import { useCallback, useEffect, useRef } from 'react';

/** Outgoing provider callbacks cannot publish state or begin further commands. */
export function useAccountGuard(userId: string | null) {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  return useCallback(() => {
    if (!active.current || !userId) throw new Error('The account changed. Please try again.');
  }, [userId]);
}
