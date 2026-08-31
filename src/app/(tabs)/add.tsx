import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButterButton, Handwriting, PaperField, PaperPanel, PlaceAutocomplete } from '@/components/scrapbook';
import { palette as brand } from '@/constants/colors';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import type { GeocodedDestination } from '@/lib/geocoding';
import { useReminders } from '@/store/ReminderProvider';
import type { ReminderCategory } from '@/types/reminder';

import '@/components/opening-login/opening-login.css';

const BELONGINGS: { id: ReminderCategory; label: string }[] = [
  { id: 'beforeUgo', label: 'Before U Go' },
  { id: 'onTheWayBack', label: 'On the way back' },
  { id: 'specific', label: 'Specific' },
];

type Layer = 'always' | 'thisTrip';

export default function AddScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const { context, addAlways, addThisTrip, addOnTheWayBack, addSpecific } = useReminders();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('beforeUgo');
  const [layer, setLayer] = useState<Layer>(context ? 'thisTrip' : 'always');
  const [place, setPlace] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<GeocodedDestination | null>(null);
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
        await addOnTheWayBack(trimmed, {
          placeName: selectedPlace?.placeName ?? place.trim(),
          latitude: selectedPlace?.latitude ?? null,
          longitude: selectedPlace?.longitude ?? null,
        });
      } else {
        await addSpecific(trimmed, {
          person: person.trim() || undefined,
          placeName: (selectedPlace?.placeName ?? place.trim()) || undefined,
          latitude: selectedPlace?.latitude ?? null,
          longitude: selectedPlace?.longitude ?? null,
        });
      }
      setTitle('');
      setPlace('');
      setSelectedPlace(null);
      setPerson('');
      setSaved(true);
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

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <PaperField
            accessibilityLabel="What to remember"
            placeholder="write something"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setSaved(false);
            }}
            autoCapitalize="sentences"
          />

          <Text style={[styles.sectionLabel, { color: colors.inkSoft }]}>where does this belong?</Text>
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
                    {
                      backgroundColor: selected ? colors.stickyButter : colors.stickyCream,
                      borderColor: selected ? colors.ink : colors.stickyEdge,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.choiceLabel, { color: selected ? brand.cream : colors.ink }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {category === 'beforeUgo' && (
            <View style={styles.sub}>
              <Text style={[styles.sectionLabel, { color: colors.inkSoft }]}>always, or this trip?</Text>
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: layer === 'always' }}
                  onPress={() => setLayer('always')}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: layer === 'always' ? colors.stickyButter : colors.paperWarm,
                      borderColor: layer === 'always' ? colors.ink : colors.stickyEdge,
                    },
                  ]}>
                  <Text style={[styles.chipLabel, { color: layer === 'always' ? brand.cream : colors.ink }]}>Always</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: layer === 'thisTrip', disabled: !context }}
                  disabled={!context}
                  onPress={() => setLayer('thisTrip')}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: layer === 'thisTrip' ? colors.stickyButter : colors.paperWarm,
                      borderColor: layer === 'thisTrip' ? colors.ink : colors.stickyEdge,
                    },
                    !context && styles.chipOff,
                  ]}>
                  <Text style={[styles.chipLabel, { color: layer === 'thisTrip' ? brand.cream : colors.ink }]}>This trip</Text>
                </Pressable>
              </View>
              {context ? (
                <Text style={[styles.fine, { color: colors.inkSoft }]}>
                  {context.destination}
                </Text>
              ) : null}
            </View>
          )}

          {category === 'onTheWayBack' && (
            <View style={styles.sub}>
              <PlaceAutocomplete
                label="add a place"
                placeholder="PetZone, Migros…"
                value={place}
                onChangeText={setPlace}
                onSelect={setSelectedPlace}
              />
            </View>
          )}

          {category === 'specific' && (
            <View style={styles.sub}>
              <PaperField
                label="person"
                placeholder="Sara, mom…"
                value={person}
                onChangeText={setPerson}
                autoCapitalize="words"
              />
              <PlaceAutocomplete
                label="place"
                placeholder="dentist, campus…"
                value={place}
                onChangeText={setPlace}
                onSelect={setSelectedPlace}
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
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
  sectionLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
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
  },
  choiceLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    fontWeight: '500',
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
  },
  chipOff: {
    opacity: 0.4,
  },
  chipLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
  },
  fine: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    marginTop: 8,
  },
  save: {
    marginTop: 22,
  },
  pressed: {
    opacity: 0.8,
  },
});
