import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { animation } from '@/constants/animation';
import { palette } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { LittleGuyExpression, LittleGuyProps } from '@/types/little-guy';
import type { MemoryParticlePosition } from '@/types/memory-particle';

import { MemoryParticle } from './MemoryParticle';

const DEFAULT_PARTICLES: MemoryParticlePosition[] = [
  { x: 8, y: 12, type: 'reminder', size: 8 },
  { x: 72, y: 4, type: 'buy', size: 7 },
  { x: 64, y: 48, type: 'trip', size: 9 },
  { x: 4, y: 52, type: 'task', size: 7 },
  { x: 40, y: 0, type: 'memory', size: 6 },
];

function Mouth({ expression, scale, isDark }: { expression: LittleGuyExpression; scale: number; isDark: boolean }) {
  const featureColor = isDark ? palette.guyFeatureDark : palette.guyFeature;

  const mouthStyles = {
    neutral: { width: 6 * scale, height: 2 * scale, borderRadius: scale },
    happy: { width: 10 * scale, height: 5 * scale, borderRadius: 5 * scale },
    curious: { width: 5 * scale, height: 5 * scale, borderRadius: 3 * scale },
    sleepy: { width: 8 * scale, height: 2 * scale, borderRadius: scale },
  };

  const mouth = mouthStyles[expression];

  return (
    <View
      style={[
        styles.mouth,
        {
          width: mouth.width,
          height: mouth.height,
          borderRadius: mouth.borderRadius,
          backgroundColor: featureColor,
          marginTop: 4 * scale,
        },
        expression === 'happy' && styles.mouthHappy,
        expression === 'sleepy' && { opacity: 0.6 },
      ]}
    />
  );
}

function Eye({ scale, blinkScale, isDark }: { scale: number; blinkScale: SharedValue<number>; isDark: boolean }) {
  const featureColor = isDark ? palette.guyFeatureDark : palette.guyFeature;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.eye,
        {
          width: 5 * scale,
          height: 5 * scale,
          borderRadius: 2.5 * scale,
          backgroundColor: featureColor,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LittleGuy({
  size = 96,
  expression = 'neutral',
  floating = true,
  showParticles = false,
  blinking = true,
}: LittleGuyProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const reduceMotion = useReducedMotion();
  const scale = size / 96;
  const floatY = useSharedValue(0);
  const blinkScale = useSharedValue(1);

  const shouldFloat = floating && !reduceMotion;
  const shouldBlink = blinking && !reduceMotion;
  const bodyColor = isDark ? palette.guyBodyDark : palette.guyBody;

  useEffect(() => {
    if (!shouldFloat) return;

    floatY.value = withRepeat(
      withSequence(
        withTiming(-animation.float.distance, {
          duration: animation.duration.float / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(animation.float.distance, {
          duration: animation.duration.float / 2,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
  }, [shouldFloat, floatY]);

  useEffect(() => {
    if (!shouldBlink) return;

    const blink = () => {
      blinkScale.value = withSequence(
        withTiming(0.1, { duration: animation.duration.blink }),
        withTiming(1, { duration: animation.duration.blink }),
        withDelay(2500 + Math.random() * 2000, withTiming(1, { duration: 0 })),
      );
    };

    blink();
    const interval = setInterval(blink, 4500 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, [shouldBlink, blinkScale]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shouldFloat ? floatY.value : 0 }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size + 16 * scale }]}>
      {showParticles &&
        DEFAULT_PARTICLES.map((particle, index) => (
          <MemoryParticle
            key={index}
            type={particle.type}
            size={particle.size * scale}
            x={particle.x * scale}
            y={particle.y * scale}
          />
        ))}

      <Animated.View style={[styles.figure, floatStyle]}>
        {/* Soft cloud-like body */}
        <View
          style={[
            styles.body,
            {
              width: 72 * scale,
              height: 64 * scale,
              borderRadius: 36 * scale,
              backgroundColor: bodyColor,
            },
          ]}>
          {/* Tiny arms */}
          <View
            style={[
              styles.arm,
              styles.armLeft,
              {
                width: 10 * scale,
                height: 6 * scale,
                borderRadius: 4 * scale,
                backgroundColor: bodyColor,
                left: -4 * scale,
                top: 36 * scale,
              },
            ]}
          />
          <View
            style={[
              styles.arm,
              styles.armRight,
              {
                width: 10 * scale,
                height: 6 * scale,
                borderRadius: 4 * scale,
                backgroundColor: bodyColor,
                right: -4 * scale,
                top: 36 * scale,
              },
            ]}
          />

          {/* Face */}
          <View style={[styles.face, { marginTop: 22 * scale }]}>
            <View style={styles.eyes}>
              <Eye scale={scale} blinkScale={blinkScale} isDark={isDark} />
              <Eye scale={scale} blinkScale={blinkScale} isDark={isDark} />
            </View>
            <Mouth expression={expression} scale={scale} isDark={isDark} />
          </View>
        </View>

        {/* Optional dangling feet */}
        <View style={[styles.feet, { marginTop: -4 * scale, gap: 14 * scale }]}>
          <View
            style={[
              styles.foot,
              {
                width: 8 * scale,
                height: 10 * scale,
                borderRadius: 4 * scale,
                backgroundColor: bodyColor,
              },
            ]}
          />
          <View
            style={[
              styles.foot,
              {
                width: 8 * scale,
                height: 10 * scale,
                borderRadius: 4 * scale,
                backgroundColor: bodyColor,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    alignItems: 'center',
  },
  body: {
    alignItems: 'center',
    position: 'relative',
  },
  arm: {
    position: 'absolute',
  },
  armLeft: {
    transform: [{ rotate: '-20deg' }],
  },
  armRight: {
    transform: [{ rotate: '20deg' }],
  },
  face: {
    alignItems: 'center',
  },
  eyes: {
    flexDirection: 'row',
    gap: 10,
  },
  eye: {},
  mouth: {},
  mouthHappy: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  feet: {
    flexDirection: 'row',
  },
  foot: {},
});
