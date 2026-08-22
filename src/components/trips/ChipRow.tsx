import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette as brand } from '@/constants/colors';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type ChipRowProps = {
  options: readonly string[];
  value: string | readonly string[];
  onChange: (value: string) => void;
  allowClear?: boolean;
};

export function ChipRow({ options, value, onChange, allowClear = true }: ChipRowProps) {
  const colors = useScrapbookPalette();

  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = Array.isArray(value) ? value.includes(option) : value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected && allowClear ? '' : option)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.stickyButter : colors.stickyCream,
                borderColor: selected ? colors.ink : colors.stickyEdge,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { color: selected ? brand.cream : colors.ink }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  label: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
  },
  pressed: {
    opacity: 0.75,
  },
});
