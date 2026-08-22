import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { openingEase, openingPalette, openingTiming, STARRY_NIGHT_FONT } from '@/constants/opening';

type LogoProps = {
  visible: boolean;
  reduceMotion?: boolean;
};

const fadeIn = {
  from: {
    opacity: 0,
    transform: [{ translateY: -10 }, { scale: 0.96 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
};

/**
 * BLUGO wordmark. Lives on the desk, not on the paper.
 */
export function Logo({ visible, reduceMotion = false }: LogoProps) {
  return (
    <Animated.Text
      accessibilityRole="header"
      className="opening-animated"
      style={[
        styles.logo,
        !visible && styles.hidden,
        visible &&
          !reduceMotion && {
            animationName: fadeIn,
            animationDuration: `${openingTiming.logoFadeMs}ms`,
            animationTimingFunction: openingEase,
            animationFillMode: 'forwards',
          },
        visible && reduceMotion && styles.shown,
      ]}>
      BLUGO
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: STARRY_NIGHT_FONT,
    fontSize: 42,
    lineHeight: 50,
    color: openingPalette.ink,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  hidden: {
    opacity: 0,
  },
  shown: {
    opacity: 1,
  },
});
