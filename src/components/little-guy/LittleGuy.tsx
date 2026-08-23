import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { animation } from '@/constants/animation';
import { palette } from '@/constants/colors';
import {
  ANTENNA_LEFT_PATH,
  ANTENNA_RIGHT_PATH,
  ARMS,
  ARTBOARD,
  BLUSH,
  BODY_PATH,
  CONSTELLATION_SLOTS,
  EYES,
  EYE_ARC_DOWN,
  EYE_ARC_UP,
  EYE_RADIUS,
  FEET,
  MOUTHS,
  SPARKLES,
  SPARKLE_PATH,
  WAND_RIBBON,
  WAND_STAR,
  WAND_STICK,
} from '@/constants/little-guy-art';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  expressionFromMood,
  faceForExpression,
  type LittleGuyExpression,
  type LittleGuyProps,
} from '@/types/little-guy';
import type { MemoryParticlePosition } from '@/types/memory-particle';

import { MemoryParticle } from './MemoryParticle';

const idle = animation.littleGuy;

const DEFAULT_PARTICLES: MemoryParticlePosition[] = [
  { ...CONSTELLATION_SLOTS[0], type: 'reminder', size: 8 },
  { ...CONSTELLATION_SLOTS[1], type: 'buy', size: 7 },
  { ...CONSTELLATION_SLOTS[2], type: 'trip', size: 9 },
  { ...CONSTELLATION_SLOTS[3], type: 'task', size: 7 },
  { ...CONSTELLATION_SLOTS[7], type: 'memory', size: 6 },
];

/** Expressions that deserve a small hop when he arrives at them. */
const REACTIONS: LittleGuyExpression[] = ['happy', 'proud', 'excited', 'surprised'];

function useGuyColors(isDark: boolean) {
  return useMemo(
    () => ({
      body: isDark ? palette.guyBodyDark : palette.guyBody,
      outline: isDark ? palette.guyOutlineDark : palette.guyOutline,
      feature: isDark ? palette.guyFeatureDark : palette.guyFeature,
      blush: isDark ? palette.guyBlushDark : palette.guyBlush,
    }),
    [isDark],
  );
}

/** Sway back and forth forever, starting from a resting middle position. */
function swayLoop(value: SharedValue<number>, amount: number, duration: number, delay: number) {
  const ease = Easing.inOut(Easing.sin);
  value.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(-amount, { duration: duration / 2, easing: ease }),
        withTiming(amount, { duration: duration / 2, easing: ease }),
      ),
      -1,
      true,
    ),
  );
}

function Eye({
  cx,
  cy,
  scale,
  radiusScale,
  color,
  blink,
  glance,
}: {
  cx: number;
  cy: number;
  scale: number;
  radiusScale: number;
  color: string;
  blink: SharedValue<number>;
  glance: SharedValue<number>;
}) {
  const rx = EYE_RADIUS.rx * radiusScale;
  const ry = EYE_RADIUS.ry * radiusScale;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glance.value * scale }, { scaleY: blink.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.eye,
        {
          left: (cx - rx) * scale,
          top: (cy - ry) * scale,
          width: rx * 2 * scale,
          height: ry * 2 * scale,
          borderRadius: rx * scale,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LittleGuy({
  size = 96,
  expression,
  mood,
  floating = true,
  showParticles = false,
  particles,
  blinking = true,
  accessibilityLabel,
}: LittleGuyProps) {
  const face = expression ?? expressionFromMood(mood);
  const shape = faceForExpression(face);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useGuyColors(isDark);
  const reduceMotion = useReducedMotion();

  const scale = size / ARTBOARD.width;
  const height = size * (ARTBOARD.height / ARTBOARD.width);

  const bob = useSharedValue(0);
  const breath = useSharedValue(0);
  const antenna = useSharedValue(0);
  const wand = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const blink = useSharedValue(1);
  const glance = useSharedValue(0);
  const hop = useSharedValue(0);

  const alive = !reduceMotion;
  const shouldFloat = floating && alive;
  const shouldBlink = blinking && alive && (shape.eyes === 'dot' || shape.eyes === 'wide');

  useEffect(() => {
    if (!alive) return;

    if (shouldFloat) swayLoop(bob, idle.bobDistance, idle.bobDuration, 0);
    swayLoop(breath, idle.breathScale, idle.breathDuration, 260);
    swayLoop(antenna, idle.antennaTilt, idle.antennaDuration, 540);
    swayLoop(wand, idle.wandTilt, idle.wandDuration, 820);
    swayLoop(sparkle, 0.28, idle.sparkleDuration, 400);

    return () => {
      cancelAnimation(bob);
      cancelAnimation(breath);
      cancelAnimation(antenna);
      cancelAnimation(wand);
      cancelAnimation(sparkle);
    };
  }, [alive, shouldFloat, bob, breath, antenna, wand, sparkle]);

  useEffect(() => {
    if (!shouldBlink) {
      blink.value = 1;
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const wait = idle.blinkMinDelay + Math.random() * idle.blinkExtraDelay;
      timer = setTimeout(() => {
        // Occasionally a double blink, which is what stops it reading as a metronome.
        const double = Math.random() < 0.25;
        blink.value = withSequence(
          withTiming(0.08, { duration: animation.duration.blink }),
          withTiming(1, { duration: animation.duration.blink }),
          ...(double
            ? [
                withDelay(140, withTiming(0.08, { duration: animation.duration.blink })),
                withTiming(1, { duration: animation.duration.blink }),
              ]
            : []),
        );
        schedule();
      }, wait);
    };

    schedule();
    return () => {
      clearTimeout(timer);
      cancelAnimation(blink);
      blink.value = 1;
    };
  }, [shouldBlink, blink]);

  useEffect(() => {
    if (!alive) {
      glance.value = 0;
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const wait = idle.glanceMinDelay + Math.random() * idle.glanceExtraDelay;
      timer = setTimeout(() => {
        const direction = Math.random() < 0.5 ? -1 : 1;
        glance.value = withSequence(
          withTiming(direction * idle.glanceDistance, { duration: 420, easing: Easing.out(Easing.quad) }),
          withDelay(900 + Math.random() * 700, withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) })),
        );
        schedule();
      }, wait);
    };

    schedule();
    return () => {
      clearTimeout(timer);
      cancelAnimation(glance);
      glance.value = 0;
    };
  }, [alive, glance]);

  useEffect(() => {
    if (!alive || !REACTIONS.includes(face)) return;

    hop.value = withSequence(
      withTiming(-idle.reactionLift, { duration: 240, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 460, easing: Easing.inOut(Easing.quad) }),
    );
  }, [alive, face, hop]);

  const lifeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (bob.value + hop.value) * scale },
      { scaleX: 1 - breath.value * 0.5 },
      { scaleY: 1 + breath.value },
    ],
  }));

  const antennaStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${antenna.value}deg` }] }));
  const wandStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${wand.value}deg` }] }));
  const sparkleStyle = useAnimatedStyle(() => ({ opacity: 0.62 + sparkle.value }));

  const dots = particles && particles.length > 0 ? particles : showParticles ? DEFAULT_PARTICLES : [];
  const eyeRadiusScale = shape.eyes === 'wide' ? 1.2 : 1;
  const stroke = colors.outline;

  return (
    <View
      style={[styles.container, { width: size, height }]}
      accessible={accessibilityLabel != null}
      accessibilityRole={accessibilityLabel != null ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={accessibilityLabel == null}
      importantForAccessibility={accessibilityLabel != null ? 'yes' : 'no-hide-descendants'}>
      {dots.map((dot, index) => (
        <MemoryParticle
          key={`${dot.type}-${dot.x}-${dot.y}-${index}`}
          type={dot.type}
          size={dot.size * scale}
          x={(dot.x - dot.size / 2) * scale}
          y={(dot.y - dot.size / 2) * scale}
          phase={index}
          animated={alive}
        />
      ))}

      <Animated.View style={[styles.layer, styles.grow, lifeStyle]}>
        {/* Antennae sit behind the fluff so their roots disappear into it. */}
        <Animated.View style={[styles.layer, styles.antennaPivot, antennaStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${ARTBOARD.width} ${ARTBOARD.height}`}>
            <Path
              d={ANTENNA_LEFT_PATH}
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={ANTENNA_RIGHT_PATH}
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        <Svg
          style={styles.layer}
          width="100%"
          height="100%"
          viewBox={`0 0 ${ARTBOARD.width} ${ARTBOARD.height}`}>
          <G stroke={stroke} strokeWidth={1.5} strokeLinejoin="round">
            {ARMS.map((arm) => (
              <Ellipse key={`arm-${arm.cx}`} {...arm} fill={colors.body} />
            ))}
            {FEET.map((foot) => (
              <Ellipse key={`foot-${foot.cx}`} {...foot} fill={colors.body} />
            ))}
            <Path d={BODY_PATH} fill={colors.body} />
          </G>

          {BLUSH.map((cheek) => (
            <Ellipse
              key={`blush-${cheek.cx}`}
              {...cheek}
              rx={cheek.rx * shape.blush}
              fill={colors.blush}
              opacity={0.72}
            />
          ))}

          {shape.eyes === 'arcUp' || shape.eyes === 'arcDown' ? (
            <G stroke={colors.feature} strokeWidth={1.7} strokeLinecap="round" fill="none">
              {(shape.eyes === 'arcUp' ? EYE_ARC_UP : EYE_ARC_DOWN).map((d) => (
                <Path key={d} d={d} />
              ))}
            </G>
          ) : null}

          <Path
            d={MOUTHS[shape.mouth]}
            stroke={colors.feature}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={shape.mouth === 'open' || shape.mouth === 'round' ? colors.feature : 'none'}
          />
        </Svg>

        {shape.eyes === 'dot' || shape.eyes === 'wide'
          ? EYES.map((eye) => (
              <Eye
                key={`eye-${eye.cx}`}
                cx={eye.cx}
                cy={eye.cy}
                scale={scale}
                radiusScale={eyeRadiusScale}
                color={colors.feature}
                blink={blink}
                glance={glance}
              />
            ))
          : null}

        <Animated.View style={[styles.layer, styles.wandPivot, wandStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${ARTBOARD.width} ${ARTBOARD.height}`}>
            <Path
              d={WAND_STICK}
              stroke={palette.guyWand}
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="none"
            />
            {WAND_RIBBON.map((loop) => (
              <Ellipse
                key={`ribbon-${loop.cx}`}
                cx={loop.cx}
                cy={loop.cy}
                rx={loop.rx}
                ry={loop.ry}
                fill={palette.guyRibbon}
                opacity={0.9}
                transform={`rotate(${loop.rotate} ${loop.cx} ${loop.cy})`}
              />
            ))}
            <Path
              d={WAND_STAR}
              fill={palette.guyStar}
              stroke={palette.guyStarOutline}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </Svg>

          <Animated.View style={[styles.layer, styles.grow, sparkleStyle]}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${ARTBOARD.width} ${ARTBOARD.height}`}>
              {SPARKLES.map((spark) => (
                <Path
                  key={`spark-${spark.x}`}
                  d={SPARKLE_PATH}
                  fill={palette.guyStar}
                  transform={`translate(${spark.x} ${spark.y}) scale(${spark.scale})`}
                />
              ))}
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    // Decorative: taps should reach whatever wraps him, e.g. the home pressable.
    pointerEvents: 'none',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  grow: {
    transformOrigin: '50% 70%',
  },
  antennaPivot: {
    transformOrigin: '50% 27%',
  },
  // RN's transformOrigin parser only handles whole-number percentages (24.5% breaks).
  wandPivot: {
    transformOrigin: '25% 60%',
  },
  eye: {
    position: 'absolute',
  },
});
