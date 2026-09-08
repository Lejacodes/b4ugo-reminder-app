import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SwipeDeleteRow } from '@/components/lists/SwipeDeleteRow';
import { PaperPanel } from '@/components/scrapbook';
import { readableFont, readableType, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type TodayItem = {
  id: string;
  title: string;
  detail?: string;
  checked: boolean;
};

type TodayItemsSectionProps = {
  items: TodayItem[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearChecked?: () => void;
};

/**
 * Standalone daily items that used to live under the hidden "Specific" tab.
 */
export function TodayItemsSection({ items, onToggle, onDelete, onClearChecked }: TodayItemsSectionProps) {
  const colors = useScrapbookPalette();
  if (items.length === 0) return null;
  const canClear = items.some((item) => item.checked);

  return (
    <PaperPanel tilt={tiltAt(4)} tape="top-left" contentStyle={styles.panel}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink }]}>
          today
        </Text>
        {onClearChecked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear checked"
            accessibilityState={{ disabled: !canClear }}
            disabled={!canClear}
            onPress={onClearChecked}
            hitSlop={8}
            style={({ pressed }) => [pressed && styles.pressed, !canClear && styles.disabled]}>
            <Text style={[styles.clear, { color: colors.inkSoft }]}>Clear checked</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <SwipeDeleteRow key={item.id} onDelete={onDelete ? () => onDelete(item.id) : undefined}>
            <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked }}
            accessibilityLabel={item.title}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View
              style={[
                styles.box,
                {
                  borderColor: colors.inkSoft,
                  backgroundColor: item.checked ? colors.stickyButter : colors.paperWarm,
                },
              ]}
            />
            <View style={styles.copy}>
              <Text
                style={[
                  styles.title,
                  readableFont,
                  { color: colors.ink, fontFamily: readableFont.fontFamily },
                  item.checked && styles.checked,
                ]}
                numberOfLines={2}>
                {item.title}
              </Text>
              {item.detail ? (
                <Text
                  style={[
                    styles.detail,
                    readableFont,
                    { color: colors.inkSoft, fontFamily: readableFont.fontFamily },
                  ]}
                  numberOfLines={1}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
          </Pressable>
          </SwipeDeleteRow>
        ))}
      </View>
    </PaperPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    ...readableFont,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    flex: 1,
  },
  clear: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.35,
  },
  list: {
    marginTop: 10,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  box: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    marginTop: 3,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '500',
  },
  checked: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  detail: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
});
