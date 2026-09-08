import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, tiltAt, readableFont } from '@/constants/scrapbook';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useReminders } from '@/store/ReminderProvider';

import '@/components/opening-login/opening-login.css';

type OnTheWayBackDeskProps = {
  /** Tab screens hide the back chevron and sit above the tab bar. */
  asTab?: boolean;
};

export function OnTheWayBackDesk({ asTab = false }: OnTheWayBackDeskProps) {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const { horizontalPadding, isTablet } = useResponsive();
  const { onTheWayBackItems, toggleReminder, deleteReminder, deleteReminders } = useReminders();

  const open = onTheWayBackItems.filter((item) => item.status === 'open');
  const done = onTheWayBackItems.filter((item) => item.status === 'done');
  const canClear = done.length > 0;

  return (
    <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: asTab ? tabBarInset : spacing.xl,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {asTab ? (
          <Handwriting variant="heading" accessibilityRole="header">
            on the way back
          </Handwriting>
        ) : (
          <ScrapbookHeader title="on the way back" icon="return-down-back-outline" />
        )}

        {onTheWayBackItems.length === 0 ? (
          <PaperPanel tilt={tiltAt(1)} tape="top-right">
            <Text
              accessibilityRole="header"
              style={[styles.emptyTitle, { color: colors.ink }]}>
              No errands along your way
            </Text>
            <Text style={[styles.emptyCopy, { color: colors.inkSoft }]}>
              Add an item in the + tab and pick a saved place (like Supermarket, Pharmacy, or Uni) to get nudged when nearby.
            </Text>
          </PaperPanel>
        ) : (
          <PaperPanel tilt={tiltAt(1)} tape="top-right">
            <View style={styles.header}>
              <Handwriting variant="title">today</Handwriting>
              <QuietLink
                label="Clear checked"
                accessibilityLabel="Clear checked"
                disabled={!canClear}
                onPress={() => deleteReminders(done.map((item) => item.id))}
              />
            </View>
            {open.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                reason={item.location ? `near ${item.location.placeName}` : undefined}
                checked={false}
                onToggle={() => toggleReminder(item.id)}
                onDelete={() => deleteReminder(item.id)}
              />
            ))}
            {done.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                reason={item.location ? `near ${item.location.placeName}` : undefined}
                checked
                onToggle={() => toggleReminder(item.id)}
                onDelete={() => deleteReminder(item.id)}
              />
            ))}
          </PaperPanel>
        )}

        <QuietLink
          label="add from the + tab"
          accessibilityLabel="Open Add to capture an errand"
          onPress={() => router.push('/(tabs)/add')}
        />
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
    gap: spacing.lg,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  emptyTitle: {
    ...readableFont,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  emptyCopy: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 8,
  },
});
