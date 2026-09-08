import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { IntentionComposer } from '@/components/trips';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, tiltAt, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatPackedProgress, tripIdentityTags } from '@/lib/trips/copy';
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
    addIntention,
    deleteIntention,
  } = useTrips();

  const trip = getTrip(id);
  const progress = packingProgress(id);
  const intentions = intentionsFor(id);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingPlace, setAddingPlace] = useState(false);
  const [addingBusy, setAddingBusy] = useState(false);

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
  const tags = tripIdentityTags(trip);
  const hasDetails = Boolean(trip.activity || trip.season || trip.accommodation || trip.transportation || trip.notes);

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
          {range ? <Text style={[styles.range, { color: colors.ink }]}>{range}</Text> : null}
          {duration ? <Text style={[styles.duration, { color: colors.inkSoft }]}>{duration}</Text> : null}
          {tags.length > 0 ? (
            <Text style={[styles.tags, { color: colors.inkSoft }]}>{tags.join(' · ')}</Text>
          ) : null}
        </PaperPanel>

        <PaperPanel tilt={tiltAt(1)} tape="top-right">
          <View style={styles.actionBlock}>
            <Handwriting variant="title">preparation</Handwriting>
            <Text style={[styles.count, { color: colors.ink }]}>
              {formatPackedProgress(progress.packed, progress.total)}
            </Text>
            <View style={styles.actions}>
              <ButterButton
                label="open packing"
                accessibilityLabel="Open packing checklist"
                onPress={() => router.push(tripHref(`/trip/${trip.id}/packing`))}
              />
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <View style={styles.actionBlock}>
            <Handwriting variant="title">travel mode</Handwriting>
            <Text style={[styles.meta, { color: colors.inkSoft, marginTop: 6 }]}>
              {trip.status === 'active'
                ? 'on'
                : intentions.length > 0
                  ? `${intentions.length} saved`
                  : 'not started'}
            </Text>
            <View style={styles.actions}>
              <ButterButton
                label="open travel mode"
                onPress={async () => {
                  if (trip.status === 'planned') await enterTravelMode(trip.id);
                  router.push(tripHref(`/trip/${trip.id}/travel-mode`));
                }}
              />
            </View>
          </View>
        </PaperPanel>

        <PaperPanel tilt={tiltAt(2)} tape="top-left">
          <Handwriting variant="title">places & plans</Handwriting>
          {intentions.length === 0 && !addingPlace ? (
            <Text style={[styles.meta, { color: colors.inkSoft, marginTop: 8 }]}>nothing yet</Text>
          ) : (
            intentions.map((item) => (
              <View key={item.id} style={styles.plan}>
                <Text style={[styles.item, { color: colors.ink }]}>{item.title}</Text>
                <Text style={[styles.meta, { color: colors.inkSoft }]}>
                  {TRAVEL_INTENTION_LABELS[item.type]}
                  {item.placeName ? ` · near ${item.placeName}` : ''}
                </Text>
                <QuietLink label="remove" onPress={() => deleteIntention(item.id)} />
              </View>
            ))
          )}
          {addingPlace ? (
            <View style={styles.composer}>
              <IntentionComposer
                busy={addingBusy}
                submitLabel="add"
                onCancel={() => setAddingPlace(false)}
                onSave={async (draft) => {
                  setAddingBusy(true);
                  try {
                    await addIntention({
                      tripId: trip.id,
                      title: draft.title,
                      type: draft.type,
                      placeName: draft.placeName,
                      note: draft.note,
                      latitude: draft.latitude,
                      longitude: draft.longitude,
                    });
                    setAddingPlace(false);
                  } finally {
                    setAddingBusy(false);
                  }
                }}
              />
            </View>
          ) : (
            <QuietLink
              label="+ add"
              accessibilityLabel="Add a place or plan"
              onPress={() => setAddingPlace(true)}
            />
          )}
        </PaperPanel>

        <PaperPanel tilt={tiltAt(3)} tape="none">
          <Handwriting variant="title">trip details</Handwriting>
          {trip.activity ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.inkSoft }]}>activity</Text>
              <Text style={[styles.item, { color: colors.ink, marginTop: 0 }]}>{trip.activity}</Text>
            </View>
          ) : null}
          {trip.season ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.inkSoft }]}>season</Text>
              <Text style={[styles.item, { color: colors.ink, marginTop: 0 }]}>{trip.season}</Text>
            </View>
          ) : null}
          {trip.accommodation ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.inkSoft }]}>stay</Text>
              <Text style={[styles.item, { color: colors.ink, marginTop: 0 }]}>{trip.accommodation}</Text>
            </View>
          ) : null}
          {trip.transportation ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.inkSoft }]}>getting there</Text>
              <Text style={[styles.item, { color: colors.ink, marginTop: 0 }]}>{trip.transportation}</Text>
            </View>
          ) : null}
          {trip.notes ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.inkSoft }]}>notes</Text>
              <Text style={[styles.item, { color: colors.ink, marginTop: 0 }]}>{trip.notes}</Text>
            </View>
          ) : null}
          {!hasDetails ? <Text style={[styles.meta, { color: colors.inkSoft, marginTop: 8 }]}>nothing yet</Text> : null}
          <QuietLink
            label="edit trip"
            accessibilityLabel="Edit this trip"
            onPress={() => router.push(tripHref(`/trip/${trip.id}/edit`))}
          />
        </PaperPanel>

        <PaperPanel tilt={tiltAt(4)} tape="top-right">
          <Handwriting variant="aside">save as template</Handwriting>
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
    ...readableFont,
    fontSize: 20,
    lineHeight: 26,
    color: scrapbookPalette.ink,
  },
  range: {
    ...readableFont,
    fontSize: 17,
    lineHeight: 23,
    marginTop: 8,
  },
  duration: {
    ...readableFont,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    marginTop: 4,
  },
  tags: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 10,
  },
  meta: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
  },
  count: {
    ...readableFont,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 6,
  },
  item: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 6,
  },
  actions: {
    marginTop: 12,
  },
  actionBlock: {
    paddingVertical: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  plan: {
    marginTop: 10,
  },
  composer: {
    marginTop: 12,
  },
  detailRow: {
    marginTop: 10,
  },
  detailLabel: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginBottom: 2,
  },
});
