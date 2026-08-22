import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { palette as brand } from '@/constants/colors';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

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
 * Matcha stamped seal. Label is the readable face so the action stays clear.
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
  const palette = useScrapbookPalette();
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
      <View
        style={[
          styles.backing,
          {
            backgroundColor: palette.butter,
            borderColor: palette.ink,
          },
        ]}
      />
      <View style={styles.face}>
        <Text style={[styles.label, { color: brand.cream }, busy && styles.labelHidden]} numberOfLines={1}>
          {label}
        </Text>
        {busy && (
          <ActivityIndicator color={brand.cream} style={StyleSheet.absoluteFill} />
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
    borderWidth: 1,
    transform: [{ rotate: '1.5deg' }],
  },
  face: {
    justifyContent: 'center',
  },
  label: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '600',
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
