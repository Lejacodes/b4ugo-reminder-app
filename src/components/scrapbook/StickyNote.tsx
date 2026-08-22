import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DISPLAY_FONT, isMatchaSurface, scrapbookType } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type StickyNoteProps = {
  label: string;
  aside?: string;
  color: string;
  tilt: string;
  selected: boolean;
  onToggle: () => void;
};

/**
 * A little square of sticky paper that can be picked up or put back.
 * Selection is shown by a pencil tick and a firmer edge, not just colour.
 */
export function StickyNote({
  label,
  aside,
  color,
  tilt,
  selected,
  onToggle,
}: StickyNoteProps) {
  const palette = useScrapbookPalette();
  const onMatcha = isMatchaSurface(color, palette);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={aside ? `${label}, ${aside}` : label}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: color,
          transform: [{ rotate: tilt }],
          borderColor: selected ? palette.ink : palette.stickyEdge,
          shadowColor: palette.ink,
        },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.corner} pointerEvents="none" />

      {selected && <Text style={[styles.tick, { color: palette.ink }]}>✓</Text>}
      <Text style={[styles.label, { color: palette.ink }]}>{label}</Text>
      {aside ? (
        <Text style={[styles.aside, { color: onMatcha ? palette.inkOnMatcha : palette.inkSoft }]}>
          {aside}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    flexBasis: '44%',
    minHeight: 92,
    minWidth: minTouchTarget,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  selected: {
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  corner: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(92, 58, 40, 0.09)',
  },
  tick: {
    position: 'absolute',
    top: 6,
    right: 9,
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
  },
  label: {
    fontFamily: DISPLAY_FONT,
    fontSize: scrapbookType.title.fontSize,
    lineHeight: scrapbookType.title.lineHeight,
  },
  aside: {
    fontFamily: DISPLAY_FONT,
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
});
