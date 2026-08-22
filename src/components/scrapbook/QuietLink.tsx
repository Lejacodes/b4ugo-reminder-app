import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { DISPLAY_FONT, scrapbookPalette, scrapbookType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

type QuietLinkProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  align?: 'flex-start' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** An underlined pencil note — the secondary action next to a butter seal. */
export function QuietLink({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  align = 'flex-start',
  style,
}: QuietLinkProps) {
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
      <Text style={styles.label}>{label}</Text>
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
    fontFamily: DISPLAY_FONT,
    fontSize: scrapbookType.aside.fontSize,
    lineHeight: scrapbookType.aside.lineHeight,
    color: scrapbookPalette.inkSoft,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
