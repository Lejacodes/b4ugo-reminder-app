import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChipRow } from '@/components/trips';
import { ButterButton, PaperField, PaperPanel } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { parseIsoDate } from '@/lib/trips/dates';
import {
  ACCOMMODATION_OPTIONS,
  ACTIVITY_OPTIONS,
  SEASON_OPTIONS,
  TRANSPORT_OPTIONS,
} from '@/lib/trips/form-options';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function EditTripScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { getTrip, updateTrip } = useTrips();
  const trip = getTrip(id);

  const [title, setTitle] = useState(trip?.title ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [startDate, setStartDate] = useState(trip?.startDate ?? '');
  const [endDate, setEndDate] = useState(trip?.endDate ?? '');
  const [duration, setDuration] = useState(trip?.durationDays != null ? String(trip.durationDays) : '');
  const [activity, setActivity] = useState(trip?.activity ?? '');
  const [season, setSeason] = useState(trip?.season ?? '');
  const [accommodation, setAccommodation] = useState(trip?.accommodation ?? '');
  const [transport, setTransport] = useState(
    trip?.transportation ? trip.transportation.split(' + ') : [],
  );
  const [notes, setNotes] = useState(trip?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="edit" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this trip isn't here</Text>
      </SafeAreaView>
    );
  }

  const save = async () => {
    if (!title.trim() || !destination.trim() || busy) return;
    if (startDate.trim() && !parseIsoDate(startDate)) {
      setError('Start date should look like 2026-09-04');
      return;
    }
    if (endDate.trim() && !parseIsoDate(endDate)) {
      setError('End date should look like 2026-09-12');
      return;
    }
    const nights = duration.trim() ? Number(duration) : null;
    if (duration.trim() && (!nights || nights <= 0)) {
      setError('Duration should be a number of days');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateTrip(trip.id, {
        title,
        destination,
        startDate: startDate || null,
        endDate: endDate || null,
        durationDays: nights,
        activity: activity || null,
        season: season || null,
        accommodation: accommodation || null,
        transportation: transport.length ? transport.join(' + ') : null,
        notes: notes || null,
      });
      router.back();
    } finally {
      setBusy(false);
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
        <ScrapbookHeader title="edit trip" />
        <PaperPanel tilt="-0.8deg" tape="top-left">
          <PaperField label="name" value={title} onChangeText={setTitle} />
          <PaperField label="where" value={destination} onChangeText={setDestination} />
          <PaperField
            label="start date"
            hint="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />
          <PaperField label="end date" value={endDate} onChangeText={setEndDate} />
          <PaperField
            label="duration in days"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>activity</Text>
          <ChipRow options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>season</Text>
          <ChipRow options={SEASON_OPTIONS} value={season} onChange={setSeason} />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>accommodation</Text>
          <ChipRow options={ACCOMMODATION_OPTIONS} value={accommodation} onChange={setAccommodation} />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>transportation</Text>
          <ChipRow
            options={TRANSPORT_OPTIONS}
            value={transport}
            onChange={(option) =>
              setTransport((current) =>
                current.includes(option)
                  ? current.filter((item) => item !== option)
                  : [...current, option],
              )
            }
            allowClear={false}
          />
          <PaperField label="notes" value={notes} onChangeText={setNotes} />
          {error ? <Text style={[styles.error, { color: colors.slipInk }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <ButterButton
              label="save"
              busy={busy}
              disabled={!title.trim() || !destination.trim()}
              onPress={save}
            />
          </View>
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
    paddingTop: spacing.sm,
    gap: spacing.lg,
    width: '100%',
  },
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    marginTop: 8,
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    paddingHorizontal: spacing.md,
  },
  error: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.message.fontSize,
    color: scrapbookPalette.slipInk,
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
  },
});
