import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { palette } from '@/constants/colors';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { formatThingsWaiting } from '@/lib/home/copy';
import type { BeforeUgoItem } from '@/types/home';

type BeforeUgoSectionProps = {
  items: BeforeUgoItem[];
  waitingLabel?: string;
  emptyHint?: string;
  completeHint?: string;
  onPress: () => void;
};

/**
 * The primary Home section — things to take or do before leaving.
 *
 * Uses small paper-slip rows rather than a flat checklist so the list still
 * reads as part of the notebook, not a productivity widget.
 */
export function BeforeUgoSection({
  items,
  waitingLabel,
  emptyHint,
  completeHint = "you're all set",
  onPress,
}: BeforeUgoSectionProps) {
  const preview = items.slice(0, 4);
  const count = items.length;
  const label = waitingLabel ?? formatThingsWaiting(count);
  const emptyMessage = emptyHint ?? (count === 0 ? completeHint : undefined);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Before U Go. ${label}. Open.`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <PaperPanel tilt={tiltAt(0)} tape="top-left" contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <Handwriting variant="title" accessibilityRole="header">
            before u go
          </Handwriting>
          <Ionicons
            name="airplane-outline"
            size={17}
            color={scrapbookPalette.doodle}
            style={styles.titleIcon}
          />
        </View>

        <Text style={styles.count}>{label}</Text>

        <Handwriting variant="aside" tone="soft" style={styles.aside}>
          take these with you
        </Handwriting>

        <View style={styles.list}>
          {preview.length === 0 && emptyMessage ? (
            <Text style={styles.more}>{emptyMessage}</Text>
          ) : (
            preview.map((item, index) => (
              <View key={item.id} style={[styles.slip, index > 0 && styles.slipGap]}>
                <View style={styles.box} accessibilityElementsHidden />
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            ))
          )}
        </View>

        {count > preview.length && (
          <Text style={styles.more}>+ {count - preview.length} more on your list</Text>
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
    transform: [{ rotate: '-8deg' }],
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
    gap: 0,
  },
  slip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: scrapbookPalette.line,
  },
  slipGap: {},
  box: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: scrapbookPalette.inkSoft,
    borderRadius: 2,
    transform: [{ rotate: '-1deg' }],
    backgroundColor: scrapbookPalette.paperWarm,
  },
  itemLabel: {
    flex: 1,
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
  },
  more: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 10,
  },
});
