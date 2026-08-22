import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatDateRange, formatDuration } from '@/lib/trips/dates';
import type { Trip } from '@/types/trip';

type TripCardProps = {
  trip: Trip;
  progress?: { packed: number; total: number };
  tiltIndex?: number;
  onPress: () => void;
};

export function TripCard({ trip, progress, tiltIndex = 0, onPress }: TripCardProps) {
  const colors = useScrapbookPalette();
  const range = formatDateRange(trip.startDate, trip.endDate);
  const duration = formatDuration(trip.durationDays);
  const spoken = [range, duration].filter(Boolean).join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}. ${trip.destination}. ${spoken}. Open trip.`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <PaperPanel tilt={tiltAt(tiltIndex)} tape={tiltIndex % 2 === 0 ? 'top-left' : 'top-right'}>
        <Handwriting variant="title">{trip.title}</Handwriting>
        <Text style={[styles.destination, { color: colors.ink }]}>{trip.destination}</Text>
        {range ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{range}</Text> : null}
        {duration ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{duration}</Text> : null}
        {progress && progress.total > 0 ? (
          <View style={styles.progress}>
            <Text style={[styles.progressText, { color: colors.ink }]}>
              {progress.packed} / {progress.total} packed
            </Text>
          </View>
        ) : null}
      </PaperPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.88,
  },
  destination: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 4,
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 2,
  },
  progress: {
    marginTop: 10,
  },
  progressText: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
  },
});
