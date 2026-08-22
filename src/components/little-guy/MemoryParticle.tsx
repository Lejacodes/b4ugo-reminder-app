import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { animation } from '@/constants/animation';
import { memoryParticleColors } from '@/constants/colors';
import type { MemoryParticleProps } from '@/types/memory-particle';

export function MemoryParticle({
  type,
  size = 10,
  x = 0,
  y = 0,
  animated = true,
}: MemoryParticleProps) {
  const offsetY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;

    offsetY.value = withRepeat(
      withSequence(
        withTiming(-animation.particle.distance, {
          duration: animation.particle.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(animation.particle.distance, {
          duration: animation.particle.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
  }, [animated, offsetY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: memoryParticleColors[type],
          left: x,
          top: y,
        },
        animated && animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    opacity: 0.85,
  },
});
