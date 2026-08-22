import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ButterButton, Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
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
  const [busy, setBusy] = useState(false);

  const open = onTheWayBackItems.filter((item) => item.status === 'open');
  const done = onTheWayBackItems.filter((item) => item.status === 'done');

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await addOnTheWayBack(trimmed, place.trim() || undefined);
      setTitle('');
      setPlace('');
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
            <TextInput
              accessibilityLabel="What to remember on the way back"
              placeholder="Buy cat food"
              placeholderTextColor={colors.inkSoft}
              value={title}
              onChangeText={setTitle}
              autoCorrect={false}
              style={[styles.input, { color: colors.ink, borderBottomColor: colors.line }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>add a place</Text>
            <TextInput
              accessibilityLabel="Place name"
              placeholder="PetZone, the post office…"
              placeholderTextColor={colors.inkSoft}
              value={place}
              onChangeText={setPlace}
              autoCorrect={false}
              style={[styles.input, { color: colors.ink, borderBottomColor: colors.line }]}
            />
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
  input: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.input.fontSize,
    minHeight: minTouchTarget,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginTop: 8,
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
});
