import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Respects the system "Reduce Motion" accessibility setting.
 * Use to disable decorative animations (e.g. Little Guy floating).
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
