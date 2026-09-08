import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WeatherBadgeMark } from '@/components/home/WeatherBadgeMark';
import { SwipeDeleteRow } from '@/components/lists/SwipeDeleteRow';
import { PaperPanel } from '@/components/scrapbook';
import { readableFont, readableType, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { BeforeUgoItem } from '@/types/home';

type BeforeUgoSectionProps = {
  items: BeforeUgoItem[];
  emptyHint?: string;
  completeHint?: string;
  onPress: () => void;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearChecked?: () => void;
  onDismissWeather?: (id: string) => void;
};

/**
 * Immediate Before U Go board — persistent necessities plus today's context.
 * Toggles here never complete the personal-necessity base record.
 */
export function BeforeUgoSection({
  items,
  emptyHint,
  completeHint = 'all set',
  onPress,
  onToggle,
  onDelete,
  onClearChecked,
  onDismissWeather,
}: BeforeUgoSectionProps) {
  const colors = useScrapbookPalette();
  const preview = items.slice(0, 8);
  const emptyMessage = emptyHint ?? (items.length === 0 ? completeHint : undefined);
  const canClear = items.some((item) => item.checked);

  return (
    <PaperPanel tilt={tiltAt(0)} tape="top-left" contentStyle={styles.panel}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Before U Go. Open."
          onPress={onPress}
          style={({ pressed }) => [styles.headerPress, pressed && styles.pressed]}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.ink }]}
            numberOfLines={1}>
            before u go
          </Text>
          <Ionicons name="airplane-outline" size={16} color={colors.doodle} style={styles.titleIcon} />
        </Pressable>
        {onClearChecked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear checked"
            accessibilityState={{ disabled: !canClear }}
            disabled={!canClear}
            onPress={onClearChecked}
            hitSlop={8}
            style={({ pressed }) => [styles.clearHit, pressed && styles.pressed, !canClear && styles.disabled]}>
            <Text style={[styles.clear, { color: colors.inkSoft }]}>Clear checked</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {preview.length === 0 && emptyMessage ? (
          <Text style={[styles.more, { color: colors.inkSoft }]}>{emptyMessage}</Text>
        ) : (
          preview.map((item) => (
            <SwipeDeleteRow key={item.id} onDelete={onDelete ? () => onDelete(item.id) : undefined}>
              <View style={[styles.slip, { borderBottomColor: colors.line }]}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(item.checked) }}
                  accessibilityLabel={item.badge ? `${item.label}. ${item.badge}` : item.label}
                  onPress={() => onToggle?.(item.id)}
                  disabled={!onToggle}
                  style={({ pressed }) => [styles.itemPress, pressed && styles.pressed]}>
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
                      style={[styles.itemLabel, { color: colors.ink }, item.checked && styles.checked]}
                      numberOfLines={2}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <WeatherBadgeMark
                        label={item.badge}
                        icon={item.badgeIcon}
                        ink={colors.inkSoft}
                        background={colors.paperWarm}
                        border={colors.stickyEdge}
                        onPress={
                          item.kind === 'weather' && onDismissWeather ? () => onDismissWeather(item.id) : undefined
                        }
                        disabled={item.kind !== 'weather'}
                      />
                    ) : null}
                  </View>
                </Pressable>
              </View>
            </SwipeDeleteRow>
          ))
        )}
      </View>

      {items.length > preview.length && (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Show more Before U Go items">
          <Text style={[styles.more, { color: colors.inkSoft }]}>
            + {items.length - preview.length} more
          </Text>
        </Pressable>
      )}
    </PaperPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerPress: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.35,
  },
  clearHit: {
    flexShrink: 0,
    paddingLeft: 8,
  },
  clear: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    ...readableFont,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  titleIcon: {
    transform: [{ rotate: '-2deg' }],
  },
  list: {
    gap: 0,
  },
  slip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemPress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  box: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    marginTop: 3,
    transform: [{ rotate: '-1deg' }],
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  itemLabel: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  checked: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  more: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 10,
  },
});
