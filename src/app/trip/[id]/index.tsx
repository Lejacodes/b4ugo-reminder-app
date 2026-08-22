import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatPackedProgress, formatRemaining } from '@/lib/trips/copy';
import { formatDateRange, formatDuration } from '@/lib/trips/dates';
import { tripHref } from '@/lib/trips/routes';
import { TRAVEL_INTENTION_LABELS } from '@/types/trip';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function TripDetailScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const {
    getTrip,
    packingProgress,
    intentionsFor,
    saveTripAsTemplate,
    archiveTrip,
    deleteTrip,
    enterTravelMode,
  } = useTrips();

  const trip = getTrip(id);
  const progress = packingProgress(id);
  const intentions = intentionsFor(id);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="trip" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this page isn't in the notebook anymore</Text>
      </SafeAreaView>
    );
  }

  const range = formatDateRange(trip.startDate, trip.endDate);
  const duration = formatDuration(trip.durationDays);

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
        <ScrapbookHeader title={trip.title} icon="airplane-outline" />

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <Text style={[styles.destination, { color: colors.ink }]}>{trip.destination}</Text>
          {range ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{range}</Text> : null}
          {duration ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{duration}</Text> : null}
          {trip.status === 'active' ? <Text style={[styles.meta, { color: colors.inkSoft }]}>travel mode is on</Text> : null}
          <QuietLink
            label="edit trip"
            accessibilityLabel="Edit this trip"
            onPress={() => router.push(tripHref(`/trip/${trip.id}/edit`))}
          />
        </PaperPanel>

        <PaperPanel tilt={tiltAt(1)} tape="top-right">
          <Handwriting variant="title">preparation</Handwriting>
          <Text style={[styles.count, { color: colors.ink }]}>{formatPackedProgress(progress.packed, progress.total)}</Text>
          <Text style={[styles.meta, { color: colors.inkSoft }]}>{formatRemaining(progress.packed, progress.total)}</Text>
          <View style={styles.actions}>
            <ButterButton
              label="open checklist"
              accessibilityLabel="Open packing checklist"
              onPress={() => router.push(tripHref(`/trip/${trip.id}/packing`))}
            />
          </View>
        </PaperPanel>

        <PaperPanel tilt={tiltAt(2)} tape="top-left">
          <Handwriting variant="title">travel mode</Handwriting>
          {intentions.length === 0 ? (
            <Text style={[styles.meta, { color: colors.inkSoft }]}>nothing yet</Text>
          ) : (
            intentions.slice(0, 4).map((item) => (
              <Text key={item.id} style={[styles.item, { color: colors.ink }]}>
                {item.title}
                <Text style={[styles.meta, { color: colors.inkSoft }]}> · {TRAVEL_INTENTION_LABELS[item.type]}</Text>
              </Text>
            ))
          )}
          <View style={styles.actions}>
            <ButterButton
              label="open travel mode"
              onPress={async () => {
                if (trip.status === 'planned') await enterTravelMode(trip.id);
                router.push(tripHref(`/trip/${trip.id}/travel-mode`));
              }}
            />
          </View>
        </PaperPanel>

        <PaperPanel tilt={tiltAt(3)} tape="none">
          <Handwriting variant="title">trip information</Handwriting>
          {trip.activity ? <Text style={[styles.item, { color: colors.ink }]}>activity · {trip.activity}</Text> : null}
          {trip.season ? <Text style={[styles.item, { color: colors.ink }]}>season · {trip.season}</Text> : null}
          {trip.accommodation ? (
            <Text style={[styles.item, { color: colors.ink }]}>stay · {trip.accommodation}</Text>
          ) : null}
          {trip.transportation ? (
            <Text style={[styles.item, { color: colors.ink }]}>getting there · {trip.transportation}</Text>
          ) : null}
          {trip.notes ? <Text style={[styles.item, { color: colors.ink }]}>{trip.notes}</Text> : null}
          {!trip.activity && !trip.season && !trip.accommodation && !trip.transportation && !trip.notes ? (
            <Text style={[styles.meta, { color: colors.inkSoft }]}>nothing yet</Text>
          ) : null}
        </PaperPanel>

        <PaperPanel tilt={tiltAt(4)} tape="top-right">
          <Handwriting variant="title">save as template</Handwriting>
          <PaperField
            placeholder="Weekend trip, Camping…"
            value={templateName}
            onChangeText={setTemplateName}
            autoCapitalize="sentences"
          />
          <ButterButton
            label="save as template"
            busy={savingTemplate}
            disabled={templateName.trim().length === 0}
            onPress={async () => {
              setSavingTemplate(true);
              try {
                await saveTripAsTemplate(trip.id, templateName);
                setTemplateName('');
              } finally {
                setSavingTemplate(false);
              }
            }}
          />
        </PaperPanel>

        <QuietLink
          label={trip.status === 'archived' ? 'already archived' : 'archive this'}
          disabled={trip.status === 'archived'}
          onPress={() => archiveTrip(trip.id)}
        />
        {confirmDelete ? (
          <QuietLink
            label="yes, delete this trip"
            accessibilityLabel="Confirm delete trip"
            onPress={async () => {
              await deleteTrip(trip.id);
              router.replace('/(tabs)/trips');
            }}
          />
        ) : (
          <QuietLink label="delete this trip" onPress={() => setConfirmDelete(true)} />
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
  destination: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 4,
  },
  count: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 8,
  },
  item: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 6,
  },
  actions: {
    marginTop: 14,
  },
});
