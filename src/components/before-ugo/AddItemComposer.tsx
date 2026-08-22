import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ButterButton, Handwriting, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
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
      <TextInput
        accessibilityLabel="Item to take"
        placeholder="Student ID, water bottle…"
        placeholderTextColor={scrapbookPalette.inkSoft}
        value={title}
        onChangeText={setTitle}
        autoCorrect={false}
        autoCapitalize="sentences"
        style={styles.input}
      />
      <Text style={styles.hint}>where does it belong?</Text>
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
            <Text style={styles.altLabel}>this trip</Text>
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
  input: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.input.fontSize,
    color: scrapbookPalette.ink,
    minHeight: minTouchTarget,
    borderBottomWidth: 1,
    borderBottomColor: scrapbookPalette.line,
    paddingVertical: 8,
  },
  hint: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
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
    color: scrapbookPalette.inkSoft,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
