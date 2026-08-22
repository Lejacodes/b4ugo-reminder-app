import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChipRow } from '@/components/trips';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatDateRange, formatDuration } from '@/lib/trips/dates';
import { formatPackedProgress, formatRemaining } from '@/lib/trips/copy';
import {
  TRAVEL_INTENTION_LABELS,
  type TravelIntentionType,
} from '@/types/trip';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

const INTENTION_TYPES: TravelIntentionType[] = ['food', 'place', 'activity', 'other'];

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

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TravelIntentionType>('food');
  const [placeName, setPlaceName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!trip) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="travel mode" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this trip isn't here</Text>
      </SafeAreaView>
    );
  }

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateIntention(editingId, { title: trimmed, type, placeName, note });
        setEditingId(null);
      } else {
        await addIntention({ tripId: trip.id, title: trimmed, type, placeName, note });
      }
      setTitle('');
      setPlaceName('');
      setNote('');
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
        <ScrapbookHeader title="travel mode" icon="map-outline" />
        <Handwriting variant="title">{trip.title}</Handwriting>
        <Text style={[styles.meta, { color: colors.inkSoft }]}>
          {[formatDateRange(trip.startDate, trip.endDate), formatDuration(trip.durationDays)]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <Handwriting variant="title">preparation</Handwriting>
          <Text style={[styles.count, { color: colors.ink }]}>{formatPackedProgress(progress.packed, progress.total)}</Text>
          <Text style={[styles.meta, { color: colors.inkSoft }]}>{formatRemaining(progress.packed, progress.total)}</Text>
          {trip.accommodation ? <Text style={[styles.item, { color: colors.ink }]}>stay · {trip.accommodation}</Text> : null}
          {trip.transportation ? (
            <Text style={[styles.item, { color: colors.ink }]}>getting there · {trip.transportation}</Text>
          ) : null}
        </PaperPanel>

        {INTENTION_TYPES.map((group, index) => {
          const rows = intentions.filter((item) => item.type === group);
          if (rows.length === 0) return null;
          return (
            <PaperPanel key={group} tilt={tiltAt(index + 1)} tape={index % 2 ? 'top-right' : 'top-left'}>
              <Handwriting variant="title">{TRAVEL_INTENTION_LABELS[group]}</Handwriting>
              {rows.map((item) => (
                <View key={item.id} style={styles.intention}>
                  <Text style={[styles.item, { color: colors.ink }]}>{item.title}</Text>
                  {item.placeName ? <Text style={[styles.meta, { color: colors.inkSoft }]}>near {item.placeName}</Text> : null}
                  {item.note ? <Text style={[styles.meta, { color: colors.inkSoft }]}>{item.note}</Text> : null}
                  <View style={styles.rowActions}>
                    <QuietLink
                      label="edit"
                      onPress={() => {
                        setEditingId(item.id);
                        setTitle(item.title);
                        setType(item.type);
                        setPlaceName(item.placeName ?? '');
                        setNote(item.note ?? '');
                      }}
                    />
                    <QuietLink label="delete" onPress={() => deleteIntention(item.id)} />
                  </View>
                </View>
              ))}
            </PaperPanel>
          );
        })}

        <PaperPanel tilt={tiltAt(6)} tape="top-right">
          <Handwriting variant="title">
            {editingId ? 'edit' : 'add'}
          </Handwriting>
          <PaperField
            placeholder="Mango sticky rice, Chatuchak…"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>kind</Text>
          <ChipRow
            options={INTENTION_TYPES.map((key) => TRAVEL_INTENTION_LABELS[key])}
            value={TRAVEL_INTENTION_LABELS[type]}
            onChange={(label) => {
              const match = INTENTION_TYPES.find((key) => TRAVEL_INTENTION_LABELS[key] === label);
              if (match) setType(match);
            }}
            allowClear={false}
          />
          <PaperField
            label="place name"
            hint="optional"
            placeholder="Chatuchak Market"
            value={placeName}
            onChangeText={setPlaceName}
          />
          <PaperField
            label="note"
            hint="optional"
            value={note}
            onChangeText={setNote}
          />
          <View style={styles.actions}>
            <ButterButton
              label={editingId ? 'save' : 'leave it'}
              busy={busy}
              disabled={title.trim().length === 0}
              onPress={save}
            />
            {editingId ? (
              <QuietLink
                label="never mind"
                onPress={() => {
                  setEditingId(null);
                  setTitle('');
                  setPlaceName('');
                  setNote('');
                }}
              />
            ) : null}
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
  count: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    color: scrapbookPalette.ink,
    marginTop: 6,
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
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    marginTop: 8,
  },
  intention: {
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actions: {
    marginTop: 12,
    gap: 4,
  },
  fine: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    color: scrapbookPalette.inkSoft,
  },
});
