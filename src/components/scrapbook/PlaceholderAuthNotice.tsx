import { StyleSheet, Text, View } from 'react-native';

import { readableType, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { useAuth } from '@/store/AuthProvider';

/**
 * Development-only banner shown while no authentication provider is wired up.
 *
 * The placeholder client accepts any password, and that must never be a
 * surprise to whoever is testing. Renders nothing once a provider is
 * configured, and nothing at all outside `__DEV__`.
 */
export function PlaceholderAuthNotice() {
  const { isProviderConfigured } = useAuth();
  const palette = useScrapbookPalette();

  if (!__DEV__ || isProviderConfigured) return null;

  return (
    <View style={[styles.note, { borderColor: palette.ink }]}>
      <Text style={[styles.text, { color: palette.inkSoft }]}>
        dev build — no auth provider connected yet. any password is accepted and nothing is
        verified.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '0.6deg' }],
  },
  text: {
    ...readableFont,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
  },
});
