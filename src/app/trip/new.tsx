import { useRouter } from 'expo-router';
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
import { tripHref } from '@/lib/trips/routes';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

const EMPTY_FORM: TripFormState = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  duration: '',
  activity: '',
  season: '',
  accommodation: '',
  transport: [],
  notes: '',
  templateId: '',
};

export default function NewTripScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { templates, createTrip } = useTrips();

  const [form, setForm] = useState<TripFormState>(EMPTY_FORM);
  const [place, setPlace] = useState<GeocodedDestination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const result = await createTrip(
        {
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
        },
        { templateId: form.templateId || undefined, generate: true },
      );
      if (result?.status === 'unchanged') setError('A matching trip is already in Trips. Nothing was added.');
      else if (result) router.replace(tripHref(`/trip/${result.entity.id}`));
    } catch {
      setError('Could not save this trip. Your details are still here — please try again.');
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
        <ScrapbookHeader title="plan something" icon="airplane-outline" />

        <PaperPanel tilt="-1deg" tape="top-left">
          <TripFormFields
            state={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onPlaceSelect={setPlace}
            templates={templates}
          />
          {error ? <Text style={[styles.error, { color: colors.slipInk }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <ButterButton label="make the list" busy={busy} disabled={!canSave} onPress={save} />
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
  error: {
    ...readableFont,
    fontSize: readableType.message.fontSize,
    color: scrapbookPalette.slipInk,
    marginTop: 12,
  },
  actions: {
    marginTop: 18,
  },
});
