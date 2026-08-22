import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChipRow } from '@/components/trips/ChipRow';
import { ButterButton, PaperField, PlaceAutocomplete, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { GeocodedDestination } from '@/lib/geocoding';
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
        hint="optional"
        placeholder="near Antalya old town"
        value={placeName}
        onChangeText={setPlaceName}
        onSelect={setPlace}
      />
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
});
