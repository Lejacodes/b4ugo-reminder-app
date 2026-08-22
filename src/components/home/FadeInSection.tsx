import { type ReactNode } from 'react';
import Animated from 'react-native-reanimated';

import { openingEase } from '@/constants/opening';

type FadeInSectionProps = {
  children: ReactNode;
  reduceMotion: boolean;
  /** Stagger delay in milliseconds. */
  delayMs?: number;
};

const fadeUp = {
  from: {
    opacity: 0,
    transform: [{ translateY: 10 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
};

/**
 * Restrained entrance for Home sections. Respects Reduce Motion by rendering
 * immediately with no animation.
 */
export function FadeInSection({ children, reduceMotion, delayMs = 0 }: FadeInSectionProps) {
  return (
    <Animated.View
      style={
        reduceMotion
          ? undefined
          : {
              animationName: fadeUp,
              animationDuration: '520ms',
              animationDelay: `${delayMs}ms`,
              animationTimingFunction: openingEase,
              animationFillMode: 'both',
            }
      }>
      {children}
    </Animated.View>
  );
}
