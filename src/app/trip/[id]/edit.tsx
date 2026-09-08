import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { computedDurationDays, TripFormFields, type TripFormState } from '@/components/trips';
import { ButterButton, PaperPanel } from '@/components/scrapbook';
import { readableType, scrapbookPalette, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { GeocodedDestination } from '@/lib/geocoding';
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

  const [form, setForm] = useState<TripFormState>({
    title: trip?.title ?? '',
    destination: trip?.destination ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    duration: trip?.durationDays != null ? String(trip.durationDays) : '',
    activity: trip?.activity ?? '',
    season: trip?.season ?? '',
    accommodation: trip?.accommodation ?? '',
    transport: trip?.transportation ? trip.transportation.split(' + ') : [],
    notes: trip?.notes ?? '',
    templateId: '',
  });
  const [place, setPlace] = useState<GeocodedDestination | null>(null);
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

  const canSave = form.title.trim().length > 0 && form.destination.trim().length > 0;

  const save = async () => {
    if (!canSave || busy) return;
    const nights = computedDurationDays(form);
    if (form.duration.trim() && nights == null) {
      setError('Duration should be a number of days');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateTrip(trip.id, {
        title: form.title,
        destination: form.destination,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        durationDays: nights,
        activity: form.activity || null,
        season: form.season || null,
        accommodation: form.accommodation || null,
        transportation: form.transport.length ? form.transport.join(' + ') : null,
        notes: form.notes || null,
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
        timezone: place?.timezone ?? null,
        country: place?.country ?? null,
        region: place?.region ?? null,
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
          <TripFormFields
            state={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onPlaceSelect={setPlace}
          />
          {error ? <Text style={[styles.error, { color: colors.slipInk }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <ButterButton label="save" busy={busy} disabled={!canSave} onPress={save} />
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
  meta: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    paddingHorizontal: spacing.md,
  },
  error: {
    ...readableFont,
    fontSize: readableType.message.fontSize,
    color: scrapbookPalette.slipInk,
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
  },
});
