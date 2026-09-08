import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaperPanel } from '@/components/scrapbook';
import { readableFont, readableType, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatThingsWaiting } from '@/lib/home/copy';
import type { OnTheWayBackGroup, OnTheWayBackItem } from '@/types/home';

type OnTheWayBackSectionProps = {
  items?: OnTheWayBackItem[];
  groups?: OnTheWayBackGroup[];
  onPress: () => void;
};

function groupsFromItems(items: OnTheWayBackItem[]): OnTheWayBackGroup[] {
  const groups: OnTheWayBackGroup[] = [];
  const index = new Map<string, OnTheWayBackGroup>();
  for (const item of items) {
    const placeName = item.placeName?.trim() || 'Along the way';
    const key = placeName.toLowerCase();
    let group = index.get(key);
    if (!group) {
      group = { placeName, items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push({ id: item.id, label: item.label });
  }
  return groups;
}

/**
 * Open errands grouped by saved place — PetZone: Buy cat food.
 */
export function OnTheWayBackSection({ items, groups, onPress }: OnTheWayBackSectionProps) {
  const colors = useScrapbookPalette();
  const resolved = groups ?? groupsFromItems(items ?? []);
  const preview = resolved.slice(0, 4);
  const count = resolved.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`On the way back. ${formatThingsWaiting(count)}. Open full list.`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <PaperPanel tilt={tiltAt(2)} tape="top-right" contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink }]} numberOfLines={1}>
            on the way back
          </Text>
          <Feather name="corner-down-left" size={16} color={colors.doodle} style={styles.titleIcon} />
        </View>

        <View style={styles.list}>
          {preview.length === 0 ? (
            <Text style={[styles.more, { color: colors.inkSoft }]}>nothing yet</Text>
          ) : (
            preview.map((group) => (
              <View key={group.placeName} style={styles.group}>
                <Text style={[styles.place, { color: colors.inkSoft }]} numberOfLines={1}>
                  {group.placeName}
                </Text>
                {group.items.slice(0, 3).map((item) => (
                  <Text key={item.id} style={[styles.itemLabel, { color: colors.ink }]} numberOfLines={2}>
                    {`${group.placeName}: ${item.label}`}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        {count > preview.reduce((sum, group) => sum + group.items.length, 0) && (
          <Text style={[styles.more, { color: colors.inkSoft }]}>+ more waiting</Text>
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
    marginBottom: 12,
  },
  sectionTitle: {
    ...readableFont,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  titleIcon: {
    transform: [{ rotate: '2deg' }],
  },
  list: {
    gap: 12,
  },
  group: {
    gap: 4,
  },
  place: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    fontWeight: '600',
  },
  itemLabel: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '500',
  },
  more: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 12,
  },
});
