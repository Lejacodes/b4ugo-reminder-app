import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { LittleGuy } from '@/components/little-guy/LittleGuy';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { useResponsive } from '@/hooks/use-responsive';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { pixelsToParticles } from '@/lib/ai/pixels-to-particles';
import { useLittleGuy } from '@/store/LittleGuyProvider';

export function LittleGuyPresence() {
  const router = useRouter();
  const colors = useScrapbookPalette();
  const { isCompact, isTablet } = useResponsive();
  const { mood, whisper, pixels } = useLittleGuy();
  const size = isTablet ? 96 : isCompact ? 68 : 80;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={whisper ? `Little Guy. ${whisper}. Open chat.` : 'Little Guy. Open chat.'}
      onPress={() => router.push('/little-guy')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LittleGuy mood={mood} size={size} floating particles={pixelsToParticles(pixels)} />
      {whisper ? (
        <Text style={[styles.whisper, { color: colors.inkSoft }]}>{whisper}</Text>
      ) : (
        <Text style={[styles.whisper, { color: colors.inkSoft }]}>i'm here if you need me ♡</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  whisper: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
