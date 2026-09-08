import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readableFont, readableType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import {
  isNecessityActiveOnDay,
  toggleNecessityDay,
  WEEKDAY_LABELS,
} from '@/lib/reminders/necessity-days';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type NecessityDayChipsProps = {
  activeDays?: number[];
  onChange: (activeDays: number[] | undefined) => void;
};

/**
 * M T W T F S S chips for weekday-scoped persistent necessities.
 */
export function NecessityDayChips({ activeDays, onChange }: NecessityDayChipsProps) {
  const colors = useScrapbookPalette();

  return (
    <View style={styles.row}>
      {WEEKDAY_LABELS.map((label, day) => {
        const selected = isNecessityActiveOnDay(activeDays, day);
        return (
          <Pressable
            key={`${label}-${day}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${label}, ${selected ? 'active' : 'inactive'}`}
            onPress={() => onChange(toggleNecessityDay(activeDays, day))}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.stickyButter : colors.paperWarm,
                borderColor: selected ? colors.ink : colors.stickyEdge,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { color: selected ? colors.paper : colors.ink }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    minWidth: 30,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  label: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
