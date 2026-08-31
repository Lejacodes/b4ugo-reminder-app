import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChipRow } from '@/components/trips/ChipRow';
import { ButterButton, PaperField, PlaceAutocomplete, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { GeocodedDestination } from '@/lib/geocoding';
import { reverseGeocodeLocation } from '@/lib/geocoding/reverse-geocode';
import { deviceLocationService } from '@/lib/location/device-location';
import { TRAVEL_INTENTION_LABELS, type TravelIntentionType } from '@/types/trip';

const INTENTION_TYPES: TravelIntentionType[] = ['food', 'place', 'activity', 'other'];

export type IntentionDraft = {
  title: string;
  type: TravelIntentionType;
  placeName: string;
  note: string;
  latitude?: number | null;
  longitude?: number | null;
};

type IntentionComposerProps = {
  initial?: Partial<IntentionDraft>;
  busy?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  onSave: (draft: IntentionDraft) => Promise<void>;
};

export function IntentionComposer({
  initial,
  busy = false,
  submitLabel = 'add',
  onCancel,
  onSave,
}: IntentionComposerProps) {
  const colors = useScrapbookPalette();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<TravelIntentionType>(initial?.type ?? 'food');
  const [placeName, setPlaceName] = useState(initial?.placeName ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [place, setPlace] = useState<GeocodedDestination | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const useCurrentLocation = async () => {
    setLocateError(null);
    setLocating(true);
    try {
      const permission = await deviceLocationService.requestPermission();
      if (permission !== 'granted') {
        setLocateError('allow location to pin where you are right now.');
        return;
      }
      const here = await deviceLocationService.getCurrentPosition({ highAccuracy: true });
      if (!here) {
        setLocateError('could not read your location.');
        return;
      }
      const label = await reverseGeocodeLocation(here);
      const placeName = label?.label ?? 'here';
      setPlaceName(placeName);
      setPlace({
        placeName,
        latitude: here.latitude,
        longitude: here.longitude,
        country: label?.country ?? null,
        region: label?.region ?? null,
        timezone: null,
      });
    } finally {
      setLocating(false);
    }
  };

  return (
    <View>
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
        label="what"
        placeholder="Ice cream, Chatuchak…"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
      />
      <PlaceAutocomplete
        label="place"
        hint="optional — or use where you are now"
        placeholder="near Antalya old town"
        value={placeName}
        onChangeText={setPlaceName}
        onSelect={setPlace}
      />
      <QuietLink
        label={locating ? 'finding you…' : 'use where i am now'}
        accessibilityLabel="Use my current GPS location"
        disabled={locating || busy}
        onPress={() => void useCurrentLocation()}
      />
      {locateError ? <Text style={[styles.locateError, { color: colors.inkSoft }]}>{locateError}</Text> : null}
      <PaperField
        label="note"
        hint="optional"
        value={note}
        onChangeText={setNote}
        autoCapitalize="sentences"
        multiline
      />
      <View style={styles.actions}>
        <ButterButton
          label={submitLabel}
          busy={busy}
          disabled={title.trim().length === 0}
          onPress={() =>
            onSave({
              title,
              type,
              placeName,
              note,
              latitude: placeName.trim() ? (place?.latitude ?? initial?.latitude ?? null) : null,
              longitude: placeName.trim() ? (place?.longitude ?? initial?.longitude ?? null) : null,
            })
          }
        />
        {onCancel ? <QuietLink label="never mind" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    marginTop: 4,
  },
  actions: {
    marginTop: 12,
    gap: 4,
  },
  locateError: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 4,
  },
});
