import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Handwriting } from '@/components/scrapbook';
import { formatAlongTheWay, formatThingsWaiting } from '@/lib/home/copy';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import type { TodaySummary } from '@/types/home';

type TodayNoteProps = {
  summary: TodaySummary;
};

/**
 * A small status slip — quieter than the two journey sections above it.
 * Only reports real open counts from the reminder store.
 */
export function TodayNote({ summary }: TodayNoteProps) {
  const lines = [
    formatThingsWaiting(summary.thingsWaiting),
    formatAlongTheWay(summary.alongTheWay),
  ];

  return (
    <View
      style={[styles.note, { transform: [{ rotate: tiltAt(4) }] }]}
      accessibilityRole="summary"
      accessibilityLabel={`Today. ${lines.join('. ')}`}>
      <View style={styles.headingRow}>
        <Handwriting variant="aside" tone="soft">
          today
        </Handwriting>
        <Ionicons
          name="star-outline"
          size={13}
          color={scrapbookPalette.butterDeep}
          style={styles.headingIcon}
        />
      </View>

      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    alignSelf: 'center',
    maxWidth: 280,
    backgroundColor: scrapbookPalette.stickyCream,
    borderWidth: 1,
    borderColor: scrapbookPalette.stickyEdge,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: scrapbookPalette.ink,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  headingIcon: {
    transform: [{ rotate: '-10deg' }],
  },
  line: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 2,
  },
});
