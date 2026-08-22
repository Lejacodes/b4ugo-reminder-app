import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { scrapbookPalette, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useReminders } from '@/store/ReminderProvider';

import '@/components/opening-login/opening-login.css';

export default function RemindersScreen() {
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const { specificItems, toggleReminder } = useReminders();

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
        <Handwriting variant="heading" accessibilityRole="header">
          specific
        </Handwriting>
        <Handwriting variant="aside" tone="soft">
          memories that aren't packing lists
        </Handwriting>

        <PaperPanel tilt={tiltAt(2)} tape="top-left">
          {specificItems.length === 0 ? (
            <Handwriting variant="aside" tone="soft">
              nothing specific yet. leave something from Add, marked Specific.
            </Handwriting>
          ) : (
            specificItems.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                reason={
                  [item.person, item.location?.placeName].filter(Boolean).join(' · ') || undefined
                }
                checked={item.status === 'done'}
                onToggle={() => toggleReminder(item.id)}
              />
            ))
          )}
        </PaperPanel>
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
    paddingTop: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
});
