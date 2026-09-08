import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BeforeUgoSection,
  FadeInSection,
  HomeHeader,
  OnTheWayBackSection,
  TodayItemsSection,
} from '@/components/home';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useDeskStyle } from '@/hooks/use-scrapbook-palette';
import { useHomeBoard } from '@/hooks/use-home-board';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';

import '@/components/opening-login/opening-login.css';

/**
 * Home is the Context Control Center: status, Before U Go, errands, Little Guy.
 */
export default function HomeScreen() {
  const desk = useDeskStyle();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isCompact, isTablet } = useResponsive();
  const {
    board,
    errandGroups,
    statusLine,
    toggleBoardItem,
    dismissWeatherItem,
    deleteBoardItem,
    clearCheckedBoard,
    toggleReminder,
    deleteReminder,
    deleteReminders,
    specificItems,
  } = useHomeBoard();

  const beforeItems = board.map((item) => ({
    id: item.id,
    label: item.title,
    checked: item.checked,
    badge: item.badge,
    badgeIcon: item.badgeIcon,
    kind: item.kind,
  }));

  return (
    <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
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
          <HomeHeader compact={isCompact} statusLine={statusLine} />
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={40}>
          <BeforeUgoSection
            items={beforeItems}
            emptyHint={beforeItems.length === 0 ? 'all set' : undefined}
            onPress={() => router.push('/before-ugo')}
            onToggle={toggleBoardItem}
            onDelete={deleteBoardItem}
            onClearChecked={clearCheckedBoard}
            onDismissWeather={(id) => {
              const item = board.find((row) => row.id === id);
              if (item) void dismissWeatherItem(item);
            }}
          />
        </FadeInSection>

        <FadeInSection reduceMotion={reduceMotion} delayMs={80}>
          <OnTheWayBackSection
            groups={errandGroups.map((group) => ({
              placeName: group.placeName,
              items: group.items.map((item) => ({ id: item.id, label: item.title })),
            }))}
            onPress={() => router.push('/(tabs)/on-the-way-back')}
          />
        </FadeInSection>

        {specificItems.length > 0 ? (
          <FadeInSection reduceMotion={reduceMotion} delayMs={120}>
            <TodayItemsSection
              items={specificItems.map((item) => ({
                id: item.id,
                title: item.title,
                detail: [item.person, item.location?.placeName].filter(Boolean).join(' · ') || undefined,
                checked: item.status === 'done',
              }))}
              onToggle={toggleReminder}
              onDelete={deleteReminder}
              onClearChecked={() =>
                deleteReminders(specificItems.filter((item) => item.status === 'done').map((item) => item.id))
              }
            />
          </FadeInSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
  },
});
