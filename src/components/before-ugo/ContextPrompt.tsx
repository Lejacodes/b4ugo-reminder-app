import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PlaceAutocomplete } from '@/components/scrapbook';
import type { GeocodedDestination } from '@/lib/geocoding';
import { palette as brand } from '@/constants/colors';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

const PURPOSES = ['Classes', 'Gym', 'Flight', 'Beach', 'Work'] as const;

type ContextPromptProps = {
  destination: string;
  onDestination: (value: string) => void;
  onDestinationSelect?: (place: GeocodedDestination | null) => void;
  purpose: string;
  onPurpose: (value: string) => void;
};

/**
 * Shown when there is no active destination. Never invents one.
 */
export function ContextPrompt({
  destination,
  onDestination,
  onDestinationSelect,
  purpose,
  onPurpose,
}: ContextPromptProps) {
  const colors = useScrapbookPalette();

  return (
    <View style={styles.wrap}>
      <Handwriting variant="title">where are you going?</Handwriting>

      <PlaceAutocomplete
        label="destination"
        placeholder="University, the gym, the airport…"
        value={destination}
        onChangeText={onDestination}
        onSelect={onDestinationSelect}
      />

      <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>what are you going for?</Text>
      <View style={styles.chips}>
        {PURPOSES.map((option) => {
          const selected = purpose === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onPurpose(selected ? '' : option)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.stickyButter : colors.stickyCream,
                  borderColor: selected ? colors.ink : colors.stickyEdge,
                },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.chipLabel, { color: selected ? brand.cream : colors.ink }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 10,
  },
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
    transform: [{ rotate: '-1deg' }],
  },
  chipLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
  },
  pressed: {
    opacity: 0.75,
  },
});
