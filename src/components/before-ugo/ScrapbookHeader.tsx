import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Handwriting } from '@/components/scrapbook';
import { scrapbookPalette } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

type ScrapbookHeaderProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function ScrapbookHeader({ title, icon }: ScrapbookHeaderProps) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={goBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={22} color={scrapbookPalette.ink} />
      </Pressable>
      <View style={styles.titleRow}>
        <Handwriting variant="heading" accessibilityRole="header">
          {title}
        </Handwriting>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={scrapbookPalette.doodle}
            style={styles.icon}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  pressed: {
    opacity: 0.55,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginTop: 2,
    transform: [{ rotate: '-8deg' }],
  },
});
