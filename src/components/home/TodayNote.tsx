import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Handwriting } from '@/components/scrapbook';
import { formatTodayThings, formatTodayWay } from '@/lib/home/copy';
import { readableType, tiltAt, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { TodaySummary } from '@/types/home';

type TodayNoteProps = {
  summary: TodaySummary;
  tripSoon?: boolean;
};

/**
 * A small status slip. Only reports real open counts.
 */
export function TodayNote({ summary, tripSoon = false }: TodayNoteProps) {
  const colors = useScrapbookPalette();
  const lines = [
    formatTodayThings(summary.thingsWaiting),
    formatTodayWay(summary.alongTheWay),
    tripSoon ? 'trip soon' : null,
  ].filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    lines.push('quiet day');
  }

  return (
    <View
      style={[
        styles.note,
        {
          transform: [{ rotate: tiltAt(4) }],
          backgroundColor: colors.stickyCream,
          borderColor: colors.stickyEdge,
          shadowColor: colors.ink,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Today. ${lines.join('. ')}`}>
      <View style={styles.headingRow}>
        <Handwriting variant="aside" tone="soft">
          today
        </Handwriting>
        <Ionicons
          name="star-outline"
          size={13}
          color={colors.doodle}
          style={styles.headingIcon}
        />
      </View>

      {lines.map((line) => (
        <Text key={line} style={[styles.line, { color: colors.ink }]}>
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
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
    ...readableFont,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    marginTop: 2,
  },
});
