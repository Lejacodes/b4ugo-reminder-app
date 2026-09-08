import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaperPanel } from '@/components/scrapbook';
import { readableFont, readableType, tiltAt } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type BeforeUgoPaperSectionProps = {
  title: string;
  aside?: string;
  /** Extra readable line under the title, e.g. "going to university". */
  context?: string;
  tape?: 'top-left' | 'top-right' | 'none';
  tiltIndex?: number;
  onClearChecked?: () => void;
  clearCheckedDisabled?: boolean;
  children: ReactNode;
};

/**
 * One paper sheet on the Before U Go desk. The sheet is not a button —
 * only the checklist rows inside are tappable.
 */
export function BeforeUgoPaperSection({
  title,
  aside,
  context,
  tape = 'none',
  tiltIndex = 0,
  onClearChecked,
  clearCheckedDisabled = false,
  children,
}: BeforeUgoPaperSectionProps) {
  const colors = useScrapbookPalette();
  return (
    <PaperPanel tilt={tiltAt(tiltIndex)} tape={tape} contentStyle={styles.panel}>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.ink }]}
          numberOfLines={1}>
          {title}
        </Text>
        {onClearChecked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear checked"
            accessibilityState={{ disabled: clearCheckedDisabled }}
            disabled={clearCheckedDisabled}
            onPress={onClearChecked}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearHit,
              pressed && styles.pressed,
              clearCheckedDisabled && styles.disabled,
            ]}>
            <Text style={[styles.clear, { color: colors.inkSoft }]}>Clear checked</Text>
          </Pressable>
        ) : null}
      </View>
      {context ? <Text style={[styles.context, { color: colors.inkSoft }]}>{context}</Text> : null}
      {aside ? <Text style={[styles.aside, { color: colors.inkSoft }]}>{aside}</Text> : null}
      <View style={styles.body}>{children}</View>
    </PaperPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingTop: 20,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearHit: {
    flexShrink: 0,
    paddingLeft: 8,
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
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  context: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 4,
  },
  aside: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 4,
  },
  body: {
    marginTop: 10,
  },
});
