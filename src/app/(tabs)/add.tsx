import { Feather, Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButterButton, Handwriting, PaperField, PaperPanel, PlaceAutocomplete } from '@/components/scrapbook';
import { palette as brand } from '@/constants/colors';
import { readableType, tiltAt, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { classifySmartAdd, type SmartAddTarget } from '@/lib/add/classify-intent';
import type { GeocodedDestination } from '@/lib/geocoding';
import { usePlaces } from '@/store/PlaceProvider';
import { useReminders } from '@/store/ReminderProvider';
import { useSync } from '@/store/SyncProvider';

import '@/components/opening-login/opening-login.css';

const TARGETS: { id: SmartAddTarget; label: string; icon: ComponentProps<typeof Feather>['name'] }[] = [
  { id: 'beforeILeave', label: 'Before I leave', icon: 'log-out' },
  { id: 'onTheWayBack', label: 'On the way back', icon: 'corner-down-left' },
  { id: 'trip', label: 'Trip', icon: 'briefcase' },
];

export default function AddScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const { context, addAlways, addThisTrip, addOnTheWayBack } = useReminders();
  const { places } = usePlaces();
  const sync = useSync();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<SmartAddTarget>('beforeILeave');
  const [manualTarget, setManualTarget] = useState(false);
  const [place, setPlace] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<GeocodedDestination | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const compactPlaces = useMemo(
    () => places.map((item) => ({ id: item.id, name: item.name, type: item.type })),
    [places],
  );

  const applyClassification = (value: string, preferManual: boolean) => {
    const classified = classifySmartAdd(value, {
      hasTripContext: Boolean(context),
      places: compactPlaces,
    });
    if (!preferManual) {
      setTarget(classified.target);
      if (classified.placeName && !selectedPlace) {
        setPlace(classified.placeName);
      }
    } else if (classified.target === 'onTheWayBack' && classified.placeName && !place.trim()) {
      setPlace(classified.placeName);
    }
  };

  const { listening, error: voiceError, onPressIn, onPressOut } = useHoldToSpeak({
    onTranscript: (spoken) => {
      setTitle(spoken);
      setSaved(false);
      applyClassification(spoken, manualTarget);
    },
  });

  const canSave = title.trim().length > 0;

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setSaved(false);
    setSaveError(null);
    try {
      const classified = classifySmartAdd(title, {
        hasTripContext: Boolean(context),
        places: compactPlaces,
      });
      const trimmed = (classified.title || title).trim();
      const nextTarget = manualTarget ? target : classified.target;
      const placeName = selectedPlace?.placeName ?? (place.trim() || classified.placeName || '');
      let result;

      if (nextTarget === 'onTheWayBack') {
        result = await addOnTheWayBack(trimmed, {
          placeName,
          latitude: selectedPlace?.latitude ?? null,
          longitude: selectedPlace?.longitude ?? null,
        });
      } else if (nextTarget === 'trip' && context) {
        result = await addThisTrip(trimmed);
      } else {
        result = await addAlways(trimmed);
      }

      if (result.status === 'unchanged') {
        setSaveError('This item is already on your list. Nothing was added.');
        return;
      }

      setTitle((current) => current === title ? '' : current);
      setPlace((current) => current === place ? '' : current);
      setSelectedPlace(null);
      setManualTarget(false);
      setTarget('beforeILeave');
      setSaved(true);
    } catch {
      setSaveError('Could not save this item. Your text is still here — please try again.');
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
          add
        </Handwriting>

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <View style={styles.captureRow}>
            <View style={styles.field}>
              <PaperField
                accessibilityLabel="What do you need to remember?"
                placeholder="What do you need to remember?"
                value={title}
                editable={!busy}
                onChangeText={(value) => {
                  setTitle(value);
                  setSaved(false);
                  applyClassification(value, manualTarget);
                }}
                autoCapitalize="sentences"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityLabel={listening ? 'Listening. Release to stop.' : 'Hold to speak'}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={({ pressed }) => [
                styles.mic,
                {
                  backgroundColor: listening || pressed ? colors.stickyButter : colors.paperWarm,
                  borderColor: listening ? colors.ink : colors.stickyEdge,
                },
              ]}>
              <Ionicons name={listening ? 'mic' : 'mic-outline'} size={22} color={colors.ink} />
            </Pressable>
          </View>

          {listening ? (
            <Text style={[styles.fine, { color: colors.inkSoft }]}>listening…</Text>
          ) : null}
          {voiceError ? (
            <Text style={[styles.fine, { color: colors.inkSoft }]}>{voiceError}</Text>
          ) : null}
          {saveError ? (
            <Text accessibilityRole="alert" style={[styles.fine, { color: colors.slipInk }]}>
              {saveError}
            </Text>
          ) : null}
          {saved ? <Text accessibilityLiveRegion="polite" style={[styles.fine, { color: colors.inkSoft }]}>Saved on this device. {sync.pending > 0 ? `${sync.pending} changes waiting to synchronize.` : ''}</Text> : null}

          <View style={styles.chips}>
            {TARGETS.map((option) => {
              const selected = target === option.id;
              const disabled = busy || option.id === 'trip' && !context;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => {
                    setTarget(option.id);
                    setManualTarget(true);
                    setSaved(false);
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.stickyButter : colors.paperWarm,
                      borderColor: selected ? colors.ink : colors.stickyEdge,
                    },
                    disabled && styles.chipOff,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.chipInner}>
                    <Feather name={option.icon} size={14} color={selected ? brand.cream : colors.ink} />
                    <Text style={[styles.chipLabel, { color: selected ? brand.cream : colors.ink }]}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {target === 'onTheWayBack' ? (
            <View style={styles.sub}>
              <PlaceAutocomplete
                label="add a place"
                placeholder="PetZone, Migros…"
                value={place}
                onChangeText={setPlace}
                onSelect={setSelectedPlace}
              />
            </View>
          ) : null}

          {target === 'trip' && context ? (
            <Text style={[styles.fine, { color: colors.inkSoft }]}>{context.destination}</Text>
          ) : null}

          <View style={styles.save}>
            <ButterButton
              label={saved ? 'Saved' : 'Save Item'}
              accessibilityLabel="Save Item"
              busy={busy}
              disabled={!canSave}
              highContrast
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
  captureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  mic: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOff: {
    opacity: 0.4,
  },
  chipLabel: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    fontWeight: '500',
  },
  sub: {
    marginTop: 8,
  },
  fine: {
    ...readableFont,
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
