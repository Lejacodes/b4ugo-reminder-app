import { useCallback, useRef, useState } from 'react';

/** Retain failures until retry and block a second press before React rerenders. */
export function useAsyncAction(action: () => unknown) {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    setPending(true); setError(null);
    try { await action(); }
    catch { setError('This action could not finish. Please review your list and try again.'); }
    finally { locked.current = false; setPending(false); }
  }, [action]);
  return { run, pending, error };
}
