import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChipRow } from '@/components/trips';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import {
  ACCOMMODATION_OPTIONS,
  ACTIVITY_OPTIONS,
  SEASON_OPTIONS,
  TRANSPORT_OPTIONS,
} from '@/lib/trips/form-options';
import { parseIsoDate } from '@/lib/trips/dates';
import { tripHref } from '@/lib/trips/routes';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function NewTripScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { templates, createTrip } = useTrips();

  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [activity, setActivity] = useState('');
  const [season, setSeason] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [transport, setTransport] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canContinue = title.trim().length > 0 && destination.trim().length > 0;

  const toggleTransport = (option: string) => {
    setTransport((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  };

  const save = async () => {
    if (!canContinue || busy) return;
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
      const trip = await createTrip(
        {
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
        },
        { templateId: templateId || undefined, generate: true },
      );
      if (trip) router.replace(tripHref(`/trip/${trip.id}`));
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

        {step === 1 ? (
          <PaperPanel tilt="-1deg" tape="top-left">
            <Handwriting variant="title">the trip</Handwriting>
            <PaperField
              label="what is this?"
              placeholder="Thailand, camping, sleepover…"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
            />
            <PaperField
              label="where?"
              placeholder="Bangkok, Şile, a friend's place…"
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="sentences"
            />
            <PaperField
              label="start date"
              hint="YYYY-MM-DD"
              placeholder="2026-09-04"
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
            />
            <PaperField
              label="end date"
              hint="or use duration below"
              placeholder="2026-09-12"
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />
            <PaperField
              label="or duration in days"
              hint="if you skip dates"
              placeholder="8"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
            <ButterButton
              label="continue"
              disabled={!canContinue}
              onPress={() => setStep(2)}
            />
          </PaperPanel>
        ) : (
          <PaperPanel tilt="-1deg" tape="top-right">
            <Handwriting variant="title">details</Handwriting>
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>activity</Text>
            <ChipRow options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>season / climate</Text>
            <ChipRow options={SEASON_OPTIONS} value={season} onChange={setSeason} />
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>accommodation</Text>
            <ChipRow options={ACCOMMODATION_OPTIONS} value={accommodation} onChange={setAccommodation} />
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>transportation</Text>
            <ChipRow
              options={TRANSPORT_OPTIONS}
              value={transport}
              onChange={toggleTransport}
              allowClear={false}
            />
            {transport.length > 0 ? (
              <Text style={[styles.meta, { color: colors.inkSoft }]}>selected: {transport.join(' + ')}</Text>
            ) : null}
            <PaperField
              label="notes"
              hint="optional"
              placeholder="anything else to remember"
              value={notes}
              onChangeText={setNotes}
              autoCapitalize="sentences"
            />
            {templates.length > 0 ? (
              <>
                <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>template</Text>
                <ChipRow
                  options={templates.map((item) => item.name)}
                  value={templates.find((item) => item.id === templateId)?.name ?? ''}
                  onChange={(name) => {
                    const match = templates.find((item) => item.name === name);
                    setTemplateId(match?.id ?? '');
                  }}
                />
              </>
            ) : null}
            {error ? <Text style={[styles.error, { color: colors.slipInk }]}>{error}</Text> : null}
            <View style={styles.actions}>
              <ButterButton label="make the list" busy={busy} onPress={save} />
              <QuietLink label="back" onPress={() => setStep(1)} />
            </View>
          </PaperPanel>
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
    marginTop: 8,
  },
  error: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.message.fontSize,
    color: scrapbookPalette.slipInk,
    marginTop: 12,
  },
  actions: {
    marginTop: 18,
    gap: 8,
  },
});
