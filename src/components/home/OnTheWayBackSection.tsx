import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { palette } from '@/constants/colors';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatThingsWaiting } from '@/lib/home/copy';
import type { OnTheWayBackItem } from '@/types/home';

type OnTheWayBackSectionProps = {
  items: OnTheWayBackItem[];
  onPress: () => void;
};

/**
 * The second pillar of Home — things to remember while out, anchored to places.
 *
 * Place names sit below each item in the readable face so the contextual
 * "when you're near…" idea reads even before geofencing exists.
 */
export function OnTheWayBackSection({ items, onPress }: OnTheWayBackSectionProps) {
  const colors = useScrapbookPalette();
  const countColor = palette.softMatcha;
  const preview = items.slice(0, 4);
  const count = items.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`On the way back. ${formatThingsWaiting(count)}. Open full list.`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <PaperPanel tilt={tiltAt(2)} tape="top-right" contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <Handwriting variant="title" accessibilityRole="header">
            on the way back
          </Handwriting>
          <Ionicons
            name="return-down-back-outline"
            size={17}
            color={colors.doodle}
            style={styles.titleIcon}
          />
        </View>

        <Text style={[styles.count, { color: countColor }]}>{formatThingsWaiting(count)}</Text>

        <Text style={[styles.aside, { color: colors.inkSoft }]}>along your way</Text>

        <View style={styles.list}>
          {preview.length === 0 ? (
            <Text style={[styles.more, { color: colors.inkSoft }]}>nothing yet</Text>
          ) : (
            preview.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.bullet, { color: colors.doodle }]} accessibilityElementsHidden>
                  •
                </Text>
                <View style={styles.copy}>
                  <Text style={[styles.itemLabel, { color: colors.ink }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                  {item.placeName ? (
                    <Text style={[styles.place, { color: colors.inkSoft }]} numberOfLines={1}>
                      Near {item.placeName}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {count > preview.length && (
          <Text style={[styles.more, { color: colors.inkSoft }]}>
            + {count - preview.length} more
          </Text>
        )}
      </PaperPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.92,
  },
  panel: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    marginTop: 2,
    transform: [{ rotate: '6deg' }],
  },
  count: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    marginTop: 6,
    fontWeight: '500',
  },
  aside: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  bullet: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '500',
  },
  place: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  more: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 12,
  },
});
