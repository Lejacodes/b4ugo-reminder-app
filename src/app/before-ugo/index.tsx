import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemComposer } from '@/components/before-ugo/AddItemComposer';
import { BeforeUgoPaperSection } from '@/components/before-ugo/BeforeUgoPaperSection';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ContextPrompt } from '@/components/before-ugo/ContextPrompt';
import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useReminders } from '@/store/ReminderProvider';

import '@/components/opening-login/opening-login.css';

export default function BeforeUgoScreen() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const {
    context,
    personalNecessities,
    alwaysChecklistItems,
    thisTripItems,
    suggestionItems,
    setGoingTo,
    clearGoingTo,
    toggleReminder,
    addAlways,
    addThisTrip,
  } = useReminders();

  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setGoingTo({ destination, purpose: purpose || null });
      setDestination('');
      setPurpose('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="opening-desk" style={styles.desk} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + spacing.xl,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScrapbookHeader title="before u go" icon="airplane-outline" />

        {!context ? (
          <>
            <PaperPanel tilt="-1.1deg" tape="top-left">
              <ContextPrompt
                destination={destination}
                onDestination={setDestination}
                purpose={purpose}
                onPurpose={setPurpose}
              />
              <View style={styles.continue}>
                <ButterButton
                  label="continue"
                  accessibilityLabel="Continue with this destination"
                  busy={saving}
                  disabled={destination.trim().length === 0}
                  onPress={handleContinue}
                />
              </View>
            </PaperPanel>

            <BeforeUgoPaperSection
              title="always"
              aside="the things you never leave without"
              tape="top-right"
              tiltIndex={2}>
              {personalNecessities.map((item) => (
                <Text key={item.id} style={styles.necessityRow}>
                  {item.title}
                </Text>
              ))}
            </BeforeUgoPaperSection>

            <AddItemComposer
              allowThisTrip={false}
              onAddAlways={addAlways}
              onAddThisTrip={addThisTrip}
            />
          </>
        ) : (
          <>
            <BeforeUgoPaperSection
              title="always"
              aside="the things you never leave without"
              tape="top-left"
              tiltIndex={0}>
              {alwaysChecklistItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  title={item.title}
                  checked={item.status === 'done'}
                  onToggle={() => toggleReminder(item.id)}
                />
              ))}
            </BeforeUgoPaperSection>

            <BeforeUgoPaperSection
              title="for this trip"
              context={`going to ${context.destination}${context.purpose ? ` · ${context.purpose}` : ''}`}
              tape="top-right"
              tiltIndex={2}>
              {thisTripItems.length === 0 ? (
                <Handwriting variant="aside" tone="soft">
                  nothing packed for this yet — add something below
                </Handwriting>
              ) : (
                thisTripItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    title={item.title}
                    reason={item.reason ?? undefined}
                    checked={item.status === 'done'}
                    onToggle={() => toggleReminder(item.id)}
                  />
                ))
              )}
            </BeforeUgoPaperSection>

            {suggestionItems.length > 0 && (
              <BeforeUgoPaperSection
                title="blugo suggests"
                aside="from this context — not from forever"
                tape="top-left"
                tiltIndex={4}>
                {suggestionItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    title={item.title}
                    reason={item.reason ?? undefined}
                    checked={item.status === 'done'}
                    onToggle={() => toggleReminder(item.id)}
                  />
                ))}
              </BeforeUgoPaperSection>
            )}

            <AddItemComposer
              allowThisTrip
              onAddAlways={addAlways}
              onAddThisTrip={addThisTrip}
            />

            <QuietLink
              label="going somewhere else?"
              accessibilityLabel="Change destination"
              onPress={() => clearGoingTo()}
            />
          </>
        )}
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
  continue: {
    marginTop: 18,
  },
  necessityRow: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
});
