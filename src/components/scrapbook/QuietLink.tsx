import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type QuietLinkProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  align?: 'flex-start' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** Underlined secondary action, in the readable face. */
export function QuietLink({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  align = 'flex-start',
  style,
}: QuietLinkProps) {
  const palette = useScrapbookPalette();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.wrap,
        { alignSelf: align },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.label, { color: palette.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
