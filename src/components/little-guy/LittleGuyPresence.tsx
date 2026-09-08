import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { LittleGuy } from '@/components/little-guy/LittleGuy';
import { Handwriting } from '@/components/scrapbook';
import { useResponsive } from '@/hooks/use-responsive';
import { pixelsToParticles } from '@/lib/ai/pixels-to-particles';
import { useLittleGuy } from '@/store/LittleGuyProvider';

type LittleGuyPresenceProps = {
  /** Compact header avatar. No whisper line. */
  compact?: boolean;
};

export function LittleGuyPresence({ compact = false }: LittleGuyPresenceProps) {
  const router = useRouter();
  const { isCompact, isTablet } = useResponsive();
  const { mood, whisper, pixels } = useLittleGuy();
  const size = compact ? (isTablet ? 56 : 46) : isTablet ? 96 : isCompact ? 68 : 80;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={whisper ? `Little Guy. ${whisper}. Open chat.` : 'Little Guy. Open chat.'}
      onPress={() => router.push('/little-guy')}
      hitSlop={compact ? 8 : 0}
      style={({ pressed }) => [compact ? styles.compact : styles.wrap, pressed && styles.pressed]}>
      <LittleGuy mood={mood} size={size} floating particles={pixelsToParticles(pixels)} />
      {compact ? null : (
        <Handwriting variant="aside" tone="soft" style={styles.whisper}>
          {whisper || "i'm here if you need me ♡"}
        </Handwriting>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  compact: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 72,
  },
  whisper: {
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
