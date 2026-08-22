import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ButterButton, Handwriting, PaperField, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { minTouchTarget } from '@/constants/typography';

type AddItemComposerProps = {
  /** When there is no active trip, only Always is offered. */
  allowThisTrip: boolean;
  onAddAlways: (title: string) => Promise<void>;
  onAddThisTrip: (title: string) => Promise<void>;
};

export function AddItemComposer({
  allowThisTrip,
  onAddAlways,
  onAddThisTrip,
}: AddItemComposerProps) {
  const colors = useScrapbookPalette();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (kind: 'always' | 'thisTrip') => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      if (kind === 'always') await onAddAlways(trimmed);
      else await onAddThisTrip(trimmed);
      setTitle('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <QuietLink
        label="add something"
        accessibilityLabel="Add something to take with you"
        onPress={() => setOpen(true)}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <Handwriting variant="aside" tone="soft">
        add something
      </Handwriting>
      <PaperField
        placeholder="Student ID, water bottle…"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
        accessibilityLabel="Item to take"
      />
      <Text style={[styles.hint, { color: colors.inkSoft }]}>always, or this trip?</Text>
      <View style={styles.row}>
        <ButterButton
          label="always"
          accessibilityLabel="Save as always"
          busy={busy}
          disabled={title.trim().length === 0}
          onPress={() => save('always')}
        />
        {allowThisTrip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save for this trip"
            disabled={busy || title.trim().length === 0}
            onPress={() => save('thisTrip')}
            style={({ pressed }) => [styles.alt, pressed && styles.pressed]}>
            <Text style={[styles.altLabel, { color: colors.inkSoft }]}>this trip</Text>
          </Pressable>
        ) : null}
      </View>
      <QuietLink label="never mind" onPress={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    paddingTop: 8,
  },
  hint: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  alt: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  altLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
