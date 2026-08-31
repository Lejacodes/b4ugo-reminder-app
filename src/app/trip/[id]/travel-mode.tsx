import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { LiveMap, type LiveMapPin } from '@/components/map';
import { IntentionComposer } from '@/components/trips';
import { Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatDateRange, formatDuration } from '@/lib/trips/dates';
import { formatPackedProgress } from '@/lib/trips/copy';
import { isValidCoordinates } from '@/lib/location/coordinates';
import { TRAVEL_INTENTION_LABELS, type TravelIntention } from '@/types/trip';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

const INTENTION_TYPES = ['food', 'place', 'activity', 'other'] as const;

export default function TravelModeScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const {
    getTrip,
    packingProgress,
    intentionsFor,
    addIntention,
    updateIntention,
    deleteIntention,
  } = useTrips();

  const trip = getTrip(id);
  const progress = packingProgress(id);
  const intentions = intentionsFor(id);

  const mapPins = useMemo(() => {
    const pins: LiveMapPin[] = [];
    if (
      trip &&
      isValidCoordinates({ latitude: trip.latitude, longitude: trip.longitude })
    ) {
      pins.push({
        id: `trip-${trip.id}`,
        latitude: trip.latitude!,
        longitude: trip.longitude!,
        title: trip.destination,
        subtitle: 'trip',
      });
    }
    for (const item of intentions) {
      if (!isValidCoordinates({ latitude: item.latitude, longitude: item.longitude })) continue;
      pins.push({
        id: item.id,
        latitude: item.latitude!,
        longitude: item.longitude!,
        title: item.title,
        subtitle: item.placeName ?? TRAVEL_INTENTION_LABELS[item.type],
      });
    }
    return pins;
  }, [intentions, trip]);

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TravelIntention | null>(null);
  const [adding, setAdding] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="travel mode" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this trip isn't here</Text>
      </SafeAreaView>
    );
  }

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
        <ScrapbookHeader title="travel mode" icon="map-outline" />
        <Handwriting variant="title">{trip.title}</Handwriting>
        <Text style={[styles.meta, { color: colors.inkSoft }]}>
          {[formatDateRange(trip.startDate, trip.endDate), formatDuration(trip.durationDays)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text style={[styles.meta, { color: colors.inkSoft }]}>
          {formatPackedProgress(progress.packed, progress.total)}
        </Text>

        <PaperPanel tilt="0.4deg" tape="top-left">
          <Handwriting variant="title">where you are</Handwriting>
          <LiveMap pins={mapPins} height={300} />
        </PaperPanel>

        {INTENTION_TYPES.map((group, index) => {
          const rows = intentions.filter((item) => item.type === group);
          if (rows.length === 0) return null;
          return (
            <PaperPanel key={group} tilt={tiltAt(index + 1)} tape={index % 2 ? 'top-right' : 'top-left'}>
              <Handwriting variant="title">{TRAVEL_INTENTION_LABELS[group]}</Handwriting>
              {rows.map((item) => (
                <View key={item.id} style={styles.intention}>
                  {editing?.id === item.id ? (
                    <IntentionComposer
                      initial={{
                        title: item.title,
                        type: item.type,
                        placeName: item.placeName ?? '',
                        note: item.note ?? '',
                        latitude: item.latitude,
                        longitude: item.longitude,
                      }}
                      busy={busy}
                      submitLabel="save"
                      onCancel={() => setEditing(null)}
                      onSave={async (draft) => {
                        setBusy(true);
                        try {
                          await updateIntention(item.id, draft);
                          setEditing(null);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Text style={[styles.item, { color: colors.ink }]}>{item.title}</Text>
                      {item.placeName ? (
                        <Text style={[styles.meta, { color: colors.inkSoft }]}>near {item.placeName}</Text>
                      ) : null}
                      {item.note ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{item.note}</Text> : null}
                      <View style={styles.rowActions}>
                        <QuietLink label="edit" onPress={() => setEditing(item)} />
                        <QuietLink label="remove" onPress={() => deleteIntention(item.id)} />
                      </View>
                    </>
                  )}
                </View>
              ))}
            </PaperPanel>
          );
        })}

        <PaperPanel tilt={tiltAt(6)} tape="top-right">
          <Handwriting variant="title">add</Handwriting>
          {adding ? (
            <IntentionComposer
              busy={busy}
              submitLabel="leave it"
              onCancel={() => setAdding(false)}
              onSave={async (draft) => {
                setBusy(true);
                try {
                  await addIntention({ tripId: trip.id, ...draft });
                  setAdding(false);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <QuietLink label="+ add" accessibilityLabel="Add a place or plan" onPress={() => setAdding(true)} />
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
    paddingTop: spacing.sm,
    gap: spacing.lg,
    width: '100%',
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 4,
  },
  item: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 6,
  },
  intention: {
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
