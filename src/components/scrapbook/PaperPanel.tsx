import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { scrapbookPalette } from '@/constants/scrapbook';

type PaperPanelProps = {
  children: ReactNode;
  /** Rotation applied to the sheet, e.g. '-1.2deg'. */
  tilt?: string;
  /** Draws a strip of washi tape across the given corner. */
  tape?: 'top-left' | 'top-right' | 'none';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * A torn-edged cream sheet. Same paper stock as the opening window but a
 * free-standing card rather than the full-height folded sheet, so screens can
 * stack several of them.
 */
export function PaperPanel({
  children,
  tilt = '-1deg',
  tape = 'none',
  style,
  contentStyle,
}: PaperPanelProps) {
  return (
    <View style={[styles.wrap, { transform: [{ rotate: tilt }] }, style]}>
      <View style={styles.backing} pointerEvents="none" />

      <View style={styles.sheet}>
        <View style={[styles.nick, styles.nickRight]} pointerEvents="none" />
        <View style={[styles.nick, styles.nickLeft]} pointerEvents="none" />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>

      {tape !== 'none' && (
        <View
          pointerEvents="none"
          style={[styles.tape, tape === 'top-left' ? styles.tapeLeft : styles.tapeRight]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  backing: {
    position: 'absolute',
    top: 6,
    left: -5,
    right: 7,
    bottom: -6,
    backgroundColor: scrapbookPalette.paperBacking,
    borderRadius: 3,
    transform: [{ rotate: '1.4deg' }],
  },
  sheet: {
    backgroundColor: scrapbookPalette.paper,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(92, 58, 40, 0.18)',
    overflow: 'hidden',
    shadowColor: scrapbookPalette.ink,
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 9,
    elevation: 3,
  },
  content: {
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  nick: {
    position: 'absolute',
    width: 13,
    height: 9,
    backgroundColor: scrapbookPalette.desk,
  },
  nickRight: {
    top: 34,
    right: -4,
    transform: [{ rotate: '16deg' }],
  },
  nickLeft: {
    bottom: 28,
    left: -5,
    transform: [{ rotate: '-20deg' }],
  },
  tape: {
    position: 'absolute',
    top: -9,
    width: 62,
    height: 20,
    backgroundColor: scrapbookPalette.tape,
    opacity: 0.9,
  },
  tapeLeft: {
    left: 14,
    transform: [{ rotate: '-6deg' }],
  },
  tapeRight: {
    right: 14,
    transform: [{ rotate: '5deg' }],
  },
});
