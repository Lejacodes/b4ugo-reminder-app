import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { LittleGuyPresence } from '@/components/little-guy/LittleGuyPresence';
import { DISPLAY_FONT, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { usePreferences } from '@/store/PreferencesProvider';

type HomeHeaderProps = {
  compact?: boolean;
  statusLine?: string | null;
};

/**
 * Wordmark, greeting, status, and a compact Little Guy that opens chat.
 */
export function HomeHeader({ compact = false, statusLine }: HomeHeaderProps) {
  const { profile } = usePreferences();
  const colors = useScrapbookPalette();
  const name = profile.displayName?.trim();
  const greeting = name ? `hey, ${name} ♡` : 'hey there ♡';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <View style={styles.wordmarkRow}>
            <Text accessibilityRole="header" style={[styles.wordmark, { color: colors.ink }]}>
              B4UGO
            </Text>
            <Ionicons name="star" size={15} color={colors.doodle} style={styles.wordmarkStar} />
          </View>
          <Text style={[styles.greeting, { color: colors.inkSoft }]}>{greeting}</Text>
          {statusLine ? (
            <Text accessibilityRole="text" style={[styles.status, { color: colors.inkSoft }]}>
              {statusLine}
            </Text>
          ) : null}
        </View>
        <LittleGuyPresence compact />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  wrapCompact: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 1,
  },
  wordmarkStar: {
    marginTop: 2,
    transform: [{ rotate: '-12deg' }],
  },
  greeting: {
    ...readableFont,
    fontSize: 16,
    lineHeight: 22,
  },
  status: {
    ...readableFont,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
