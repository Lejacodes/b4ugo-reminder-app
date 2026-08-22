import { useEffect, useState } from 'react';

import { openingTiming, type OpeningStage } from '@/constants/opening';

/**
 * Drives the opening sequence as discrete stages.
 * Reduce Motion jumps straight to the settled paper + login.
 */
export function useOpeningStages(reduceMotion: boolean): OpeningStage {
  const [stage, setStage] = useState<OpeningStage>(reduceMotion ? 'login' : 'logo');

  useEffect(() => {
    if (reduceMotion) {
      setStage('login');
      return;
    }

    setStage('logo');

    const timers = [
      setTimeout(() => setStage('ball'), openingTiming.ballMs),
      setTimeout(() => setStage('unfold'), openingTiming.unfoldMs),
      setTimeout(() => setStage('settle'), openingTiming.settleMs),
      setTimeout(() => setStage('login'), openingTiming.loginMs),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [reduceMotion]);

  return stage;
}
