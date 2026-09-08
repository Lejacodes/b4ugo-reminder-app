import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { animation } from '@/constants/animation';
import { memoryParticleColors, memoryParticleColorsDark } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MemoryParticleProps } from '@/types/memory-particle';

/**
 * Each dot gets its own drift period and twinkle delay, derived from its
 * position in the constellation, so the ring breathes unevenly instead of
 * pulsing together like a loading indicator.
 */
function rhythm(phase: number) {
  return {
    driftDuration: animation.particle.duration + (phase % 4) * 620,
    driftDelay: (phase % 5) * 340,
    twinkleDuration: 2200 + (phase % 3) * 900,
    twinkleDelay: (phase % 6) * 280,
    driftX: phase % 2 === 0 ? animation.particle.distance * 0.45 : -animation.particle.distance * 0.45,
  };
}

export function MemoryParticle({
  type,
  size = 10,
  x = 0,
  y = 0,
  animated = true,
  phase = 0,
}: MemoryParticleProps) {
  const isDark = useColorScheme() === 'dark';
  const color = (isDark ? memoryParticleColorsDark : memoryParticleColors)[type];
  const beat = useMemo(() => rhythm(phase), [phase]);
  const drift = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      drift.value = 0;
      twinkle.value = 0;
      return;
    }

    const ease = Easing.inOut(Easing.sin);

    drift.value = withDelay(
      beat.driftDelay,
      withRepeat(
        withSequence(
          withTiming(-1, { duration: beat.driftDuration / 2, easing: ease }),
          withTiming(1, { duration: beat.driftDuration / 2, easing: ease }),
        ),
        -1,
        true,
      ),
    );

    twinkle.value = withDelay(
      beat.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: beat.twinkleDuration / 2, easing: ease }),
          withTiming(0, { duration: beat.twinkleDuration / 2, easing: ease }),
        ),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(drift);
      cancelAnimation(twinkle);
    };
  }, [animated, beat, drift, twinkle]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + twinkle.value * 0.24,
    transform: [
      { translateY: drift.value * animation.particle.distance },
      { translateX: drift.value * beat.driftX },
      { scale: 0.94 + twinkle.value * 0.1 },
    ],
  }));

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(280) : undefined}
      exiting={animated ? FadeOut.duration(220) : undefined}
      style={[styles.particle, { left: x, top: y, width: size, height: size }]}>
      <Animated.View style={[{ width: size, height: size }, animated ? animatedStyle : styles.still]}>
        <View
          style={[
            styles.halo,
            {
              width: size * 2.4,
              height: size * 2.4,
              borderRadius: size * 1.2,
              marginLeft: -size * 0.7,
              marginTop: -size * 0.7,
              backgroundColor: color,
            },
          ]}
        />
        <View
          style={[styles.core, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  still: {
    opacity: 0.85,
  },
  halo: {
    position: 'absolute',
    opacity: 0.16,
  },
  core: {
    position: 'absolute',
  },
});
