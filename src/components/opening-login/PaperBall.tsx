import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { openingEase, openingEaseExit, openingPalette } from '@/constants/opening';

type PaperBallProps = {
  visible: boolean;
  exiting?: boolean;
  reduceMotion?: boolean;
};

const idleBob = {
  '0%': { transform: [{ translateY: 0 }, { rotate: '-8deg' }, { scale: 1 }] },
  '50%': { transform: [{ translateY: -5 }, { rotate: '6deg' }, { scale: 1.04 }] },
  '100%': { transform: [{ translateY: 0 }, { rotate: '-8deg' }, { scale: 1 }] },
};

const crumpleAway = {
  from: {
    opacity: 1,
    transform: [{ translateY: 0 }, { rotate: '-8deg' }, { scale: 1 }],
  },
  to: {
    opacity: 0,
    transform: [{ translateY: 6 }, { rotate: '18deg' }, { scale: 0.55 }],
  },
};

/**
 * Illustrated crumpled note — overlapping paper scraps, not a 3D simulation.
 */
export function PaperBall({ visible, exiting = false, reduceMotion = false }: PaperBallProps) {
  if (!visible && !exiting) return null;

  return (
    <Animated.View
      pointerEvents="none"
      className="opening-animated"
      style={[
        styles.wrap,
        exiting && !reduceMotion
          ? {
              animationName: crumpleAway,
              animationDuration: '520ms',
              animationTimingFunction: openingEaseExit,
              animationFillMode: 'forwards',
            }
          : null,
        visible &&
          !exiting &&
          !reduceMotion && {
            animationName: idleBob,
            animationDuration: '1600ms',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          },
        reduceMotion && styles.still,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.scrap, styles.scrapA]} />
      <View style={[styles.scrap, styles.scrapB]} />
      <View style={[styles.scrap, styles.scrapC]} />
      <View style={[styles.scrap, styles.scrapD]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 58,
    height: 58,
  },
  still: {
    transform: [{ rotate: '-6deg' }],
  },
  scrap: {
    position: 'absolute',
    backgroundColor: openingPalette.paperWarm,
    borderWidth: 1,
    borderColor: 'rgba(96, 51, 20, 0.22)',
  },
  scrapA: {
    width: 38,
    height: 34,
    top: 4,
    left: 2,
    borderRadius: 11,
    transform: [{ rotate: '-22deg' }],
  },
  scrapB: {
    width: 36,
    height: 36,
    top: 10,
    left: 16,
    borderRadius: 13,
    backgroundColor: openingPalette.paper,
    transform: [{ rotate: '18deg' }],
  },
  scrapC: {
    width: 30,
    height: 28,
    top: 18,
    left: 8,
    borderRadius: 10,
    backgroundColor: openingPalette.tape,
    opacity: 0.85,
    transform: [{ rotate: '8deg' }],
  },
  scrapD: {
    width: 18,
    height: 16,
    top: 6,
    left: 20,
    borderRadius: 7,
    backgroundColor: openingPalette.paperBacking,
    transform: [{ rotate: '-12deg' }],
  },
});
