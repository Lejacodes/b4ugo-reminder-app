import { StyleSheet, Text, View } from 'react-native';

import { readableType, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type SlipNoteProps = {
  message: string | null;
};

/**
 * A torn pink slip for the one thing that went wrong.
 *
 * Only messages from `AuthError` reach this — provider responses are mapped to
 * a fixed set of phrasings first, so nothing here can reveal whether an
 * address is registered or what a service returned.
 *
 * Set in the readable face: a message telling someone what went wrong is the
 * last place to make them squint.
 */
export function SlipNote({ message }: SlipNoteProps) {
  const palette = useScrapbookPalette();
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.slip,
        {
          backgroundColor: palette.slip,
          borderColor: 'rgba(140, 74, 69, 0.28)',
        },
      ]}>
      <Text style={[styles.text, { color: palette.slipInk }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    transform: [{ rotate: '-0.8deg' }],
  },
  text: {
    ...readableFont,
    fontSize: readableType.message.fontSize,
    lineHeight: readableType.message.lineHeight,
  },
});
