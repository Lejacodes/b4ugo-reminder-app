import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddItemComposer } from '@/components/before-ugo/AddItemComposer';
import { BeforeUgoPaperSection } from '@/components/before-ugo/BeforeUgoPaperSection';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ContextPrompt } from '@/components/before-ugo/ContextPrompt';
import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function BeforeUgoScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
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
  const { upcomingTrips } = useTrips();

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
    <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
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
              {upcomingTrips.length > 0 ? (
                <View style={styles.tripHints}>
                  <Text style={[styles.tripHintLabel, { color: colors.inkSoft }]}>from your trips</Text>
                  {upcomingTrips.slice(0, 3).map((trip) => (
                    <QuietLink
                      key={trip.id}
                      label={trip.title}
                      accessibilityLabel={`Use trip ${trip.title} as this departure`}
                      onPress={() => {
                        setDestination(trip.destination || trip.title);
                        setPurpose(trip.activity ?? '');
                      }}
                    />
                  ))}
                </View>
              ) : null}
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
              tape="top-right"
              tiltIndex={2}>
              {personalNecessities.map((item) => (
                <ChecklistItem
                  key={item.id}
                  title={item.title}
                  checked={false}
                  onToggle={() => {}}
                />
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
                <Text style={[styles.necessityRow, { color: colors.inkSoft }]}>nothing yet</Text>
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
  tripHints: {
    marginTop: 16,
  },
  tripHintLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  necessityRow: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
});
