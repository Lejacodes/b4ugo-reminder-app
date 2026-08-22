import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { DISPLAY_FONT, scrapbookPalette, scrapbookType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

type ButterButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Shows a spinner and blocks repeat presses. */
  busy?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The butter-yellow stamped seal, in the same hand as the opening window's
 * "come in" button: an offset backing card with the label pressed on top.
 */
export function ButterButton({
  label,
  onPress,
  accessibilityLabel,
  busy = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButterButtonProps) {
  const inactive = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.seal,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.backing} />
      {/* The label stays mounted while busy so the seal keeps its width. */}
      <View style={styles.face}>
        <Text style={[styles.label, busy && styles.labelHidden]} numberOfLines={1}>
          {label}
        </Text>
        {busy && (
          <ActivityIndicator
            color={scrapbookPalette.ink}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seal: {
    alignSelf: 'flex-start',
    minHeight: minTouchTarget,
    minWidth: 128,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    transform: [{ rotate: '-2deg' }],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  backing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: scrapbookPalette.butter,
    borderWidth: 1,
    borderColor: 'rgba(92, 58, 40, 0.2)',
    transform: [{ rotate: '1.5deg' }],
  },
  face: {
    justifyContent: 'center',
  },
  label: {
    fontFamily: DISPLAY_FONT,
    fontSize: scrapbookType.title.fontSize,
    lineHeight: scrapbookType.title.lineHeight,
    color: scrapbookPalette.ink,
    textAlign: 'center',
  },
  labelHidden: {
    opacity: 0,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});
