import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Handwriting } from '@/components/scrapbook';
import { DISPLAY_FONT } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { usePreferences } from '@/store/PreferencesProvider';

type HomeHeaderProps = {
  compact?: boolean;
};

/**
 * BLUGO wordmark and a warm greeting. No mascot — Home stands on its own.
 */
export function HomeHeader({ compact = false }: HomeHeaderProps) {
  const { profile } = usePreferences();
  const colors = useScrapbookPalette();
  const name = profile.displayName?.trim();
  const greeting = name ? `hey, ${name}` : 'hey there';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.wordmarkRow}>
        <Text accessibilityRole="header" style={[styles.wordmark, { color: colors.ink }]}>
          B4UGO
        </Text>
        <Ionicons
          name="star"
          size={15}
          color={colors.doodle}
          style={styles.wordmarkStar}
        />
      </View>
      <Handwriting variant={compact ? 'title' : 'heading'} tone="soft" style={styles.greeting}>
        {greeting}
      </Handwriting>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    gap: 4,
  },
  wrapCompact: {
    paddingTop: 0,
    paddingBottom: 4,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    fontFamily: DISPLAY_FONT,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 1,
    textAlign: 'center',
  },
  wordmarkStar: {
    marginTop: 2,
    transform: [{ rotate: '-12deg' }],
  },
  greeting: {
    textAlign: 'center',
  },
});
