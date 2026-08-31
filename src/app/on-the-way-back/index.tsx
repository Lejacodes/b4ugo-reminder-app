import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ButterButton, Handwriting, PaperField, PaperPanel, PlaceAutocomplete, QuietLink } from '@/components/scrapbook';
import type { GeocodedDestination } from '@/lib/geocoding';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useReminders } from '@/store/ReminderProvider';

import '@/components/opening-login/opening-login.css';

export default function OnTheWayBackScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { onTheWayBackItems, toggleReminder, addOnTheWayBack } = useReminders();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<GeocodedDestination | null>(null);
  const [busy, setBusy] = useState(false);

  const open = onTheWayBackItems.filter((item) => item.status === 'open');
  const done = onTheWayBackItems.filter((item) => item.status === 'done');

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await addOnTheWayBack(trimmed, {
        placeName: selectedPlace?.placeName ?? place.trim(),
        latitude: selectedPlace?.latitude ?? null,
        longitude: selectedPlace?.longitude ?? null,
      });
      setTitle('');
      setPlace('');
      setSelectedPlace(null);
      setComposing(false);
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
        <ScrapbookHeader title="on the way back" icon="return-down-back-outline" />

        {onTheWayBackItems.length === 0 && !composing ? (
          <PaperPanel tilt={tiltAt(1)} tape="top-right">
            <Text style={[styles.fieldLabel, { color: colors.inkSoft, marginTop: 0 }]}>nothing yet</Text>
          </PaperPanel>
        ) : (
          <PaperPanel tilt={tiltAt(1)} tape="top-right">
            <Handwriting variant="title">today</Handwriting>
            {open.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                reason={item.location ? `near ${item.location.placeName}` : undefined}
                checked={false}
                onToggle={() => toggleReminder(item.id)}
              />
            ))}
            {done.map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                reason={item.location ? `near ${item.location.placeName}` : undefined}
                checked
                onToggle={() => toggleReminder(item.id)}
              />
            ))}
          </PaperPanel>
        )}

        {composing ? (
          <PaperPanel tilt={tiltAt(3)} tape="top-left">
            <Handwriting variant="title">add</Handwriting>
            <PaperField
              accessibilityLabel="What to remember on the way back"
              placeholder="Buy cat food"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
            />
            <PlaceAutocomplete
              label="add a place"
              placeholder="PetZone, Migros…"
              value={place}
              onChangeText={setPlace}
              onSelect={setSelectedPlace}
            />
            <Text style={[styles.hint, { color: colors.inkSoft }]}>
              Pick the shop from the list so B4UGO knows where to nudge you when you pass by.
            </Text>
            <View style={styles.actions}>
              <ButterButton
                label="leave it"
                busy={busy}
                disabled={title.trim().length === 0}
                onPress={save}
              />
              <QuietLink label="never mind" onPress={() => setComposing(false)} />
            </View>
          </PaperPanel>
        ) : (
          <QuietLink
            label="+ add"
            accessibilityLabel="Add something for the way back"
            onPress={() => setComposing(true)}
          />
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
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    marginTop: 14,
  },
  actions: {
    marginTop: 16,
    gap: 4,
  },
  hint: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    marginTop: 8,
  },
});
