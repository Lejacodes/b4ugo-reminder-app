import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { palette as brand } from '@/constants/colors';
import { readableFont, readableType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { useAsyncAction } from '@/hooks/use-async-action';

type ButterButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Shows a spinner and blocks repeat presses. */
  busy?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Solid matcha fill with white type for a primary action. */
  highContrast?: boolean;
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
  highContrast = false,
}: ButterButtonProps) {
  const palette = useScrapbookPalette();
  const action = useAsyncAction(onPress);
  const working = busy || action.pending;
  const inactive = disabled || working;
  const fill = highContrast ? brand.deepForest : palette.butterDeep;
  const typeColor = highContrast ? brand.cream : palette.inkOnMatcha;

  return (
    <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: working }}
      disabled={inactive}
      onPress={action.run}
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
            backgroundColor: fill,
            borderColor: palette.ink,
          },
        ]}
      />
      <View style={styles.face}>
        <Text style={[styles.label, { color: typeColor }, working && styles.labelHidden]} numberOfLines={1}>
          {label}
        </Text>
        {working && (
          <ActivityIndicator color={typeColor} style={StyleSheet.absoluteFill} />
        )}
      </View>
    </Pressable>
    {action.error ? <Text accessibilityRole="alert" style={[readableFont, readableType.item, { color: palette.ink }]}>{action.error}</Text> : null}
    </>
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
    ...readableFont,
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
