import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeforeUgoPaperSection } from '@/components/before-ugo/BeforeUgoPaperSection';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ContextPrompt } from '@/components/before-ugo/ContextPrompt';
import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { planClearChecked } from '@/lib/home/clear-checked';
import { packingItemsForHomeBoard } from '@/lib/home/departing-trips';
import { sessionCheckKey } from '@/lib/home/departure-session';
import type { GeocodedDestination } from '@/lib/geocoding';
import { isNecessityActiveToday } from '@/lib/reminders/necessity-days';
import { todayIso } from '@/lib/trips/dates';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function BeforeUgoScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, isTablet } = useResponsive();
  const {
    context,
    personalNecessities,
    thisTripItems,
    suggestionItems,
    departureSession,
    persistDepartureSession,
    setGoingTo,
    clearGoingTo,
    toggleReminder,
    deleteReminder,
    deleteReminders,
    deleteNecessity,
  } = useReminders();
  const { upcomingTrips, trips, packingItems, togglePackingItem, deletePackingItem } = useTrips();

  const departingPacking = useMemo(
    () => packingItemsForHomeBoard(trips, packingItems, todayIso()),
    [packingItems, trips],
  );

  const showTripReminders = departingPacking.length === 0;
  const [destination, setDestination] = useState('');
  const [destinationPlace, setDestinationPlace] = useState<GeocodedDestination | null>(null);
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  const necessityRows = useMemo(
    () =>
      personalNecessities
        .filter((item) => isNecessityActiveToday(item))
        .map((item) => {
          const id = sessionCheckKey('nec', item.id);
          return {
            id,
            necessityId: item.id,
            title: item.title,
            checked: departureSession.checks[id] === true,
            persistKind: 'session' as const,
          };
        })
        .filter((item) => !departureSession.cleared.includes(item.id)),
    [departureSession.checks, departureSession.cleared, personalNecessities],
  );

  const toggleNecessity = async (necessityId: string) => {
    const id = sessionCheckKey('nec', necessityId);
    await persistDepartureSession({
      ...departureSession,
      checks: { ...departureSession.checks, [id]: !departureSession.checks[id] },
      cleared: departureSession.cleared.filter((value) => value !== id),
    });
  };

  const clearNecessities = async () => {
    const plan = planClearChecked(necessityRows, departureSession);
    await persistDepartureSession(plan.nextSession);
  };

  const clearReminderSection = async (items: { id: string; status: string }[]) => {
    await deleteReminders(items.filter((item) => item.status === 'done').map((item) => item.id));
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setGoingTo({
        destination,
        purpose: purpose || null,
        latitude: destinationPlace?.latitude ?? null,
        longitude: destinationPlace?.longitude ?? null,
        country: destinationPlace?.country ?? null,
        region: destinationPlace?.region ?? null,
      });
      setDestination('');
      setDestinationPlace(null);
      setPurpose('');
    } finally {
      setSaving(false);
    }
  };

  const goAdd = () => router.push('/(tabs)/add');

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
        <ScrapbookHeader title="before you go" icon="airplane-outline" />

        {!context ? (
          <PaperPanel tilt="-1.1deg" tape="top-left">
            <ContextPrompt
              destination={destination}
              onDestination={setDestination}
              onDestinationSelect={setDestinationPlace}
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
        ) : (
          <QuietLink
            label="going somewhere else?"
            accessibilityLabel="Change destination"
            onPress={() => clearGoingTo()}
          />
        )}

        <BeforeUgoPaperSection
          title="always"
          tape="top-left"
          tiltIndex={0}
          onClearChecked={clearNecessities}
          clearCheckedDisabled={!necessityRows.some((item) => item.checked)}>
          {necessityRows.map((item) => (
            <ChecklistItem
              key={item.necessityId}
              title={item.title}
              checked={item.checked}
              onToggle={() => toggleNecessity(item.necessityId)}
              onDelete={() => deleteNecessity(item.necessityId)}
            />
          ))}
        </BeforeUgoPaperSection>

        {departingPacking.length > 0 ? (
          <BeforeUgoPaperSection
            title="for this trip"
            context="from your packing list"
            tape="top-right"
            tiltIndex={2}>
            {departingPacking.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                checked={item.checked}
                onToggle={() => togglePackingItem(item.id)}
                onDelete={() => deletePackingItem(item.id)}
              />
            ))}
          </BeforeUgoPaperSection>
        ) : null}

        {context ? (
          <>
            {showTripReminders ? (
              <BeforeUgoPaperSection
                title="for this trip"
                context={`going to ${context.destination}${context.purpose ? ` · ${context.purpose}` : ''}`}
                tape="top-right"
                tiltIndex={2}
                onClearChecked={() => clearReminderSection(thisTripItems)}
                clearCheckedDisabled={!thisTripItems.some((item) => item.status === 'done')}>
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
                      onDelete={() => deleteReminder(item.id)}
                    />
                  ))
                )}
              </BeforeUgoPaperSection>
            ) : null}

            {suggestionItems.length > 0 ? (
              <BeforeUgoPaperSection
                title="b4ugo suggests"
                tape="top-left"
                tiltIndex={4}
                onClearChecked={() => clearReminderSection(suggestionItems)}
                clearCheckedDisabled={!suggestionItems.some((item) => item.status === 'done')}>
                {suggestionItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    title={item.title}
                    reason={item.reason ?? undefined}
                    checked={item.status === 'done'}
                    onToggle={() => toggleReminder(item.id)}
                    onDelete={() => deleteReminder(item.id)}
                  />
                ))}
              </BeforeUgoPaperSection>
            ) : null}
          </>
        ) : null}

        <QuietLink
          label="add from the + tab"
          accessibilityLabel="Open Add to capture something"
          onPress={goAdd}
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
  continue: {
    marginTop: 18,
  },
  tripHints: {
    marginTop: 16,
  },
  tripHintLabel: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  necessityRow: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
});
