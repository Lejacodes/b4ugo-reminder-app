import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { openingEase, openingEaseSettle, openingPalette, openingTiming } from '@/constants/opening';

export type PaperPhase = 'hidden' | 'unfolding' | 'settled';

type UnfoldingPaperProps = {
  phase: PaperPhase;
  reduceMotion?: boolean;
  children?: ReactNode;
};

const unfold = {
  '0%': {
    opacity: 0.85,
    transform: [
      { perspective: 900 },
      { rotateX: '64deg' },
      { rotateY: '-26deg' },
      { rotateZ: '16deg' },
      { scale: 0.22 },
    ],
  },
  '38%': {
    opacity: 1,
    transform: [
      { perspective: 900 },
      { rotateX: '18deg' },
      { rotateY: '-10deg' },
      { rotateZ: '4deg' },
      { scale: 0.72 },
    ],
  },
  '72%': {
    opacity: 1,
    transform: [
      { perspective: 900 },
      { rotateX: '5deg' },
      { rotateY: '-2deg' },
      { rotateZ: '-1deg' },
      { scale: 0.96 },
    ],
  },
  '100%': {
    opacity: 1,
    transform: [
      { perspective: 900 },
      { rotateX: '0deg' },
      { rotateY: '-0.6deg' },
      { rotateZ: '-0.8deg' },
      { scale: 1 },
    ],
  },
};

const settle = {
  '0%': {
    transform: [
      { perspective: 900 },
      { rotateX: '0deg' },
      { rotateY: '-0.6deg' },
      { rotateZ: '-0.8deg' },
      { scale: 1 },
    ],
  },
  '45%': {
    transform: [
      { perspective: 900 },
      { rotateX: '0deg' },
      { rotateY: '0.4deg' },
      { rotateZ: '0.6deg' },
      { scale: 1.012 },
    ],
  },
  '100%': {
    transform: [
      { perspective: 900 },
      { rotateX: '0deg' },
      { rotateY: '-0.4deg' },
      { rotateZ: '-0.5deg' },
      { scale: 1 },
    ],
  },
};

const settledTransform = [
  { perspective: 900 },
  { rotateX: '0deg' },
  { rotateY: '-0.4deg' },
  { rotateZ: '-0.5deg' },
  { scale: 1 },
] as const;

/**
 * Illustrated sheet that unfolds via CSS 3D transforms (rotateX/Y/Z + scale).
 * Not a physical paper solver. Irregular edges are drawn, not clip-path photos.
 */
export function UnfoldingPaper({
  phase,
  reduceMotion = false,
  children,
}: UnfoldingPaperProps) {
  const show = phase !== 'hidden' || reduceMotion;

  return (
    <Animated.View
      className="opening-animated"
      style={[
        styles.stage,
        !show && styles.hidden,
        !reduceMotion &&
          phase === 'unfolding' && {
            animationName: unfold,
            animationDuration: `${openingTiming.unfoldDurationMs}ms`,
            animationTimingFunction: openingEase,
            animationFillMode: 'forwards',
          },
        !reduceMotion &&
          phase === 'settled' && {
            transform: [...settledTransform],
            animationName: settle,
            animationDuration: `${openingTiming.settleDurationMs}ms`,
            animationTimingFunction: openingEaseSettle,
            animationFillMode: 'forwards',
          },
        reduceMotion && { transform: [...settledTransform], opacity: 1 },
      ]}>
      <View style={[styles.backing, { backgroundColor: openingPalette.paperBacking }]} />

      <View style={[styles.sheet, { backgroundColor: openingPalette.paper }]}>
        <View className="opening-paper-grain" style={styles.grain} pointerEvents="none">
          {Array.from({ length: 14 }).map((_, index) => (
            <View
              key={index}
              style={[styles.rule, { top: 56 + index * 22, backgroundColor: openingPalette.line }]}
            />
          ))}
          <View style={[styles.margin, { backgroundColor: openingPalette.marginLine }]} />
        </View>

        <View style={[styles.tape, { backgroundColor: openingPalette.tape }]} />
        <View style={[styles.clipArm, { backgroundColor: openingPalette.clip }]} />
        <View style={[styles.clipLoop, { borderColor: openingPalette.butterDeep }]} />
        <Text style={styles.starGlyph}>★</Text>
        <Text style={styles.doodleStar}>★</Text>
        <Text style={styles.doodleStarB}>★</Text>
        <Text style={styles.flower}>✿</Text>
        <Text style={styles.flowerB}>✿</Text>

        <View style={[styles.nick, styles.nickA]} />
        <View style={[styles.nick, styles.nickB]} />
        <View style={[styles.nick, styles.nickC]} />

        <View style={styles.body}>{children}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '88%',
    maxWidth: 360,
    aspectRatio: 0.72,
  },
  hidden: {
    opacity: 0,
  },
  backing: {
    position: 'absolute',
    top: 10,
    left: -8,
    right: 10,
    bottom: -8,
    borderRadius: 3,
    transform: [{ rotate: '1.6deg' }],
    shadowColor: openingPalette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  sheet: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(92, 58, 40, 0.18)',
    overflow: 'hidden',
    transform: [{ rotate: '-0.7deg' }],
    shadowColor: openingPalette.ink,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  grain: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  rule: {
    position: 'absolute',
    left: 28,
    right: 16,
    height: StyleSheet.hairlineWidth,
  },
  margin: {
    position: 'absolute',
    top: 48,
    bottom: 16,
    left: 26,
    width: StyleSheet.hairlineWidth,
  },
  tape: {
    position: 'absolute',
    top: 18,
    right: -6,
    width: 18,
    height: 72,
    opacity: 0.88,
    transform: [{ rotate: '8deg' }],
  },
  clipArm: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: '42%',
    width: 28,
    height: 14,
    borderRadius: 2,
  },
  clipLoop: {
    position: 'absolute',
    top: -16,
    left: '44%',
    width: 18,
    height: 22,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'transparent',
  },
  starGlyph: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    fontSize: 22,
    color: openingPalette.butter,
    transform: [{ rotate: '-18deg' }],
  },
  doodleStar: {
    position: 'absolute',
    top: 24,
    left: 10,
    fontSize: 12,
    color: openingPalette.doodle,
    opacity: 0.55,
    transform: [{ rotate: '16deg' }],
  },
  doodleStarB: {
    position: 'absolute',
    top: 42,
    right: 18,
    fontSize: 10,
    color: openingPalette.doodle,
    opacity: 0.45,
    transform: [{ rotate: '-12deg' }],
  },
  flower: {
    position: 'absolute',
    bottom: 46,
    right: 14,
    fontSize: 14,
    color: openingPalette.doodle,
    opacity: 0.4,
  },
  flowerB: {
    position: 'absolute',
    bottom: 62,
    right: 28,
    fontSize: 11,
    color: openingPalette.doodle,
    opacity: 0.35,
  },
  nick: {
    position: 'absolute',
    width: 14,
    height: 10,
    backgroundColor: openingPalette.desk,
  },
  nickA: {
    top: 90,
    right: -4,
    transform: [{ rotate: '18deg' }],
  },
  nickB: {
    bottom: 80,
    left: -5,
    transform: [{ rotate: '-22deg' }],
  },
  nickC: {
    bottom: -3,
    right: 40,
    width: 18,
    height: 8,
    transform: [{ rotate: '8deg' }],
  },
  body: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 36,
  },
});
