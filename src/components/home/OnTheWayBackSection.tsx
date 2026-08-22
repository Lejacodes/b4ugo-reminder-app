import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { palette } from '@/constants/colors';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { formatThingsWaiting } from '@/lib/home/mock-data';
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
            color={scrapbookPalette.doodle}
            style={styles.titleIcon}
          />
        </View>

        <Text style={styles.count}>{formatThingsWaiting(count)}</Text>

        <Handwriting variant="aside" tone="soft" style={styles.aside}>
          along your way
        </Handwriting>

        <View style={styles.list}>
          {preview.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.bullet} accessibilityElementsHidden>
                •
              </Text>
              <View style={styles.copy}>
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
                <Text style={styles.place} numberOfLines={1}>
                  Near {item.placeName}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {count > preview.length && (
          <Text style={styles.more}>+ {count - preview.length} more along your way</Text>
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
    color: palette.deepForest,
    marginTop: 6,
    fontWeight: '500',
  },
  aside: {
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
    color: scrapbookPalette.butterDeep,
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
    color: scrapbookPalette.ink,
    fontWeight: '500',
  },
  place: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
  },
  more: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 12,
  },
});
