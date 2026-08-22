import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Handwriting } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

const PURPOSES = ['Classes', 'Gym', 'Flight', 'Beach', 'Work'] as const;

type ContextPromptProps = {
  destination: string;
  onDestination: (value: string) => void;
  purpose: string;
  onPurpose: (value: string) => void;
};

/**
 * Shown when there is no active destination. Never invents one.
 */
export function ContextPrompt({
  destination,
  onDestination,
  purpose,
  onPurpose,
}: ContextPromptProps) {
  return (
    <View style={styles.wrap}>
      <Handwriting variant="title">where are you going?</Handwriting>
      <Handwriting variant="aside" tone="soft" style={styles.aside}>
        BLUGO won't guess. tell it, then it can pack with you.
      </Handwriting>

      <Text style={styles.fieldLabel}>destination</Text>
      <TextInput
        accessibilityLabel="Destination"
        placeholder="University, the gym, the airport…"
        placeholderTextColor={scrapbookPalette.inkSoft}
        value={destination}
        onChangeText={onDestination}
        autoCorrect={false}
        autoCapitalize="sentences"
        returnKeyType="next"
        style={styles.input}
      />

      <Text style={styles.fieldLabel}>what are you going for?</Text>
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
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.chipLabel}>{option}</Text>
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
  aside: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 10,
  },
  input: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.input.fontSize,
    color: scrapbookPalette.ink,
    minHeight: minTouchTarget,
    borderBottomWidth: 1,
    borderBottomColor: scrapbookPalette.line,
    paddingVertical: 8,
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
    backgroundColor: scrapbookPalette.stickyCream,
    borderWidth: 1,
    borderColor: scrapbookPalette.stickyEdge,
    transform: [{ rotate: '-1deg' }],
  },
  chipSelected: {
    backgroundColor: scrapbookPalette.stickyButter,
    borderColor: scrapbookPalette.ink,
  },
  chipLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    color: scrapbookPalette.ink,
  },
  pressed: {
    opacity: 0.75,
  },
});
