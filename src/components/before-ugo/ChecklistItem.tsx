import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SwipeDeleteRow } from '@/components/lists/SwipeDeleteRow';
import { palette as brand } from '@/constants/colors';
import { readableFont, readableType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type ChecklistItemProps = {
  title: string;
  reason?: string;
  checked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
};

/**
 * One take-with-you row. The box is the affordance; the reason (when present)
 * is readable sans so the "why" stays scannable.
 */
export function ChecklistItem({ title, reason, checked, onToggle, onDelete }: ChecklistItemProps) {
  const colors = useScrapbookPalette();
  const label = reason ? `${title}. ${reason}` : title;

  return (
    <SwipeDeleteRow onDelete={onDelete}>
      <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View
        style={[
          styles.box,
          {
            borderColor: colors.ink,
            backgroundColor: checked ? colors.butter : colors.paper,
          },
        ]}>
        {checked && <Ionicons name="checkmark" size={14} color={brand.cream} />}
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            readableFont,
            { color: checked ? colors.inkSoft : colors.ink, fontFamily: readableFont.fontFamily },
            checked && styles.titleChecked,
          ]}
          numberOfLines={2}>
          {title}
        </Text>
        {reason ? (
          <Text
            style={[
              styles.reason,
              readableFont,
              { color: colors.inkSoft, fontFamily: readableFont.fontFamily },
              checked && styles.reasonChecked,
            ]}
            numberOfLines={2}>
            {reason}
          </Text>
        ) : null}
      </View>
      </Pressable>
    </SwipeDeleteRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: minTouchTarget,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.72,
  },
  box: {
    width: 22,
    height: 22,
    marginTop: 2,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-1.5deg' }],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  titleChecked: {
    textDecorationLine: 'line-through',
  },
  reason: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  reasonChecked: {
    opacity: 0.7,
  },
});
