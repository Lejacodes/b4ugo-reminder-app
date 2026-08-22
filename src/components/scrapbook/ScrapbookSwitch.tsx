import { Pressable, StyleSheet, View } from 'react-native';

import { palette as brand } from '@/constants/colors';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type ScrapbookSwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

/**
 * Native-feeling toggle. Matcha when on. Never platform blue.
 */
export function ScrapbookSwitch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: ScrapbookSwitchProps) {
  const colors = useScrapbookPalette();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.hit,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? brand.softMatcha : colors.paperWarm,
            borderColor: value ? brand.softMatcha : colors.stickyEdge,
          },
        ]}>
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: value ? brand.cream : colors.ink,
              alignSelf: value ? 'flex-end' : 'flex-start',
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 30,
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.4,
  },
});
