import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BeforeUgoSection,
  FadeInSection,
  HomeHeader,
  OnTheWayBackSection,
  TodayNote,
} from '@/components/home';
import { ButterButton } from '@/components/scrapbook';
import { scrapbookPalette } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { getHomeMockData } from '@/lib/home/mock-data';

import '@/components/opening-login/opening-login.css';

/**
 * Home answers one question: "What do I need to remember around my journey
 * today?" The two journey sections teach B4UGO's core idea; everything else
 * stays out of the way.
 */
export default function HomeScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isCompact, isTablet } = useResponsive();
  const data = getHomeMockData();

  return (
    <SafeAreaView className="opening-desk" style={styles.desk} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: tabBarInset,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <FadeInSection reduceMotion={reduceMotion} delayMs={0}>
          <HomeHeader compact={isCompact} />
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={80}>
          <BeforeUgoSection
            items={data.beforeUgo}
            onPress={() => router.push('/(tabs)/reminders')}
          />
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={160}>
          <OnTheWayBackSection
            items={data.onTheWayBack}
            onPress={() => router.push('/(tabs)/reminders')}
          />
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={240}>
          <View style={styles.todaySlot}>
            <TodayNote summary={data.today} />
          </View>
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={320}>
          <View style={styles.action}>
            <ButterButton
              label="+ leave something"
              accessibilityLabel="Leave something to remember later"
              onPress={() => router.push('/(tabs)/add')}
            />
          </View>
        </FadeInSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: scrapbookPalette.desk,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    width: '100%',
  },
  todaySlot: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  action: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
});
