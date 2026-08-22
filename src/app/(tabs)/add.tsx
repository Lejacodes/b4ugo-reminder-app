import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButterButton, Handwriting, PaperPanel } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useReminders } from '@/store/ReminderProvider';
import type { ReminderCategory } from '@/types/reminder';

import '@/components/opening-login/opening-login.css';

const BELONGINGS: { id: ReminderCategory; label: string; aside: string }[] = [
  { id: 'beforeUgo', label: 'Before U Go', aside: 'take it before you leave' },
  { id: 'onTheWayBack', label: 'On the way back', aside: 'while you are already out' },
  { id: 'specific', label: 'Specific', aside: 'a memory with a moment' },
];

type Layer = 'always' | 'thisTrip';

export default function AddScreen() {
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const { context, addAlways, addThisTrip, addOnTheWayBack, addSpecific } = useReminders();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('beforeUgo');
  const [layer, setLayer] = useState<Layer>(context ? 'thisTrip' : 'always');
  const [place, setPlace] = useState('');
  const [person, setPerson] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const canSave = title.trim().length > 0;

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setSaved(false);
    try {
      const trimmed = title.trim();
      if (category === 'beforeUgo') {
        if (layer === 'thisTrip' && context) await addThisTrip(trimmed);
        else await addAlways(trimmed);
      } else if (category === 'onTheWayBack') {
        await addOnTheWayBack(trimmed, place.trim() || undefined);
      } else {
        await addSpecific(trimmed, {
          person: person.trim() || undefined,
          placeName: place.trim() || undefined,
        });
      }
      setTitle('');
      setPlace('');
      setPerson('');
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="opening-desk" style={styles.desk} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: tabBarInset,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Handwriting variant="heading" accessibilityRole="header">
          leave something
        </Handwriting>
        <Handwriting variant="aside" tone="soft">
          what do you want future you to remember?
        </Handwriting>

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <TextInput
            accessibilityLabel="What to remember"
            placeholder="write something"
            placeholderTextColor={scrapbookPalette.inkSoft}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setSaved(false);
            }}
            autoCorrect={false}
            autoCapitalize="sentences"
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>where does this belong?</Text>
          <View style={styles.choices}>
            {BELONGINGS.map((option) => {
              const selected = category === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(option.id)}
                  style={({ pressed }) => [
                    styles.choice,
                    selected && styles.choiceOn,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.choiceLabel}>{option.label}</Text>
                  <Text style={styles.choiceAside}>{option.aside}</Text>
                </Pressable>
              );
            })}
          </View>

          {category === 'beforeUgo' && (
            <View style={styles.sub}>
              <Text style={styles.sectionLabel}>always, or this trip?</Text>
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: layer === 'always' }}
                  onPress={() => setLayer('always')}
                  style={[styles.chip, layer === 'always' && styles.chipOn]}>
                  <Text style={styles.chipLabel}>Always</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: layer === 'thisTrip', disabled: !context }}
                  disabled={!context}
                  onPress={() => setLayer('thisTrip')}
                  style={[styles.chip, layer === 'thisTrip' && styles.chipOn, !context && styles.chipOff]}>
                  <Text style={styles.chipLabel}>This trip</Text>
                </Pressable>
              </View>
              {!context ? (
                <Text style={styles.fine}>
                  No destination yet — this will go on Always. Set where you're going from Before U
                  Go first.
                </Text>
              ) : (
                <Text style={styles.fine}>this trip: {context.destination}</Text>
              )}
            </View>
          )}

          {category === 'onTheWayBack' && (
            <View style={styles.sub}>
              <Text style={styles.sectionLabel}>near where? (optional)</Text>
              <TextInput
                accessibilityLabel="Place name"
                placeholder="PetZone, Migros…"
                placeholderTextColor={scrapbookPalette.inkSoft}
                value={place}
                onChangeText={setPlace}
                autoCorrect={false}
                style={styles.input}
              />
              <Text style={styles.fine}>
                Place names are saved. Walking up to them will not notify you until geofencing is
                connected.
              </Text>
            </View>
          )}

          {category === 'specific' && (
            <View style={styles.sub}>
              <Text style={styles.sectionLabel}>person (optional)</Text>
              <TextInput
                accessibilityLabel="Person"
                placeholder="Sara, mom…"
                placeholderTextColor={scrapbookPalette.inkSoft}
                value={person}
                onChangeText={setPerson}
                autoCorrect={false}
                style={styles.input}
              />
              <Text style={styles.sectionLabel}>place (optional)</Text>
              <TextInput
                accessibilityLabel="Place"
                placeholder="dentist, campus…"
                placeholderTextColor={scrapbookPalette.inkSoft}
                value={place}
                onChangeText={setPlace}
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.save}>
            <ButterButton
              label={saved ? 'left it' : 'leave it'}
              accessibilityLabel="Save"
              busy={busy}
              disabled={!canSave}
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
    paddingTop: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
  input: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.input.fontSize,
    color: scrapbookPalette.ink,
    minHeight: minTouchTarget,
    borderBottomWidth: 1,
    borderBottomColor: scrapbookPalette.line,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    marginTop: 18,
    marginBottom: 8,
  },
  choices: {
    gap: 8,
  },
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: scrapbookPalette.stickyEdge,
    backgroundColor: scrapbookPalette.stickyCream,
  },
  choiceOn: {
    backgroundColor: scrapbookPalette.stickyButter,
    borderColor: scrapbookPalette.ink,
  },
  choiceLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    color: scrapbookPalette.ink,
    fontWeight: '500',
  },
  choiceAside: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    marginTop: 2,
  },
  sub: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: scrapbookPalette.stickyEdge,
    backgroundColor: scrapbookPalette.paperWarm,
  },
  chipOn: {
    backgroundColor: scrapbookPalette.stickyButter,
    borderColor: scrapbookPalette.ink,
  },
  chipOff: {
    opacity: 0.4,
  },
  chipLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    color: scrapbookPalette.ink,
  },
  fine: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 8,
  },
  save: {
    marginTop: 22,
  },
  pressed: {
    opacity: 0.8,
  },
});
