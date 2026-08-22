import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { palette } from '@/constants/colors';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
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
  completeHint = 'all set',
  onPress,
}: BeforeUgoSectionProps) {
  const colors = useScrapbookPalette();
  const countColor = palette.softMatcha;
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
            color={colors.doodle}
            style={styles.titleIcon}
          />
        </View>

        <Text style={[styles.count, { color: countColor }]}>{label}</Text>

        <Text style={[styles.aside, { color: colors.inkSoft }]}>take with you</Text>

        <View style={styles.list}>
          {preview.length === 0 && emptyMessage ? (
            <Text style={[styles.more, { color: colors.inkSoft }]}>{emptyMessage}</Text>
          ) : (
            preview.map((item, index) => (
              <View
                key={item.id}
                style={[styles.slip, { borderBottomColor: colors.line }, index > 0 && styles.slipGap]}>
                <View
                  style={[
                    styles.box,
                    { borderColor: colors.inkSoft, backgroundColor: colors.paperWarm },
                  ]}
                  accessibilityElementsHidden
                />
                <Text style={[styles.itemLabel, { color: colors.ink }]} numberOfLines={2}>
                  {item.label}
                </Text>
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
    transform: [{ rotate: '-8deg' }],
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
    gap: 0,
  },
  slip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slipGap: {},
  box: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    transform: [{ rotate: '-1deg' }],
  },
  itemLabel: {
    flex: 1,
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  more: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 10,
  },
});
