import { Text } from 'react-native';

import { ChipRow } from '@/components/trips/ChipRow';
import { DateField, PaperField, PlaceAutocomplete } from '@/components/scrapbook';
import { readableType, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { GeocodedDestination } from '@/lib/geocoding';
import { daysBetween, formatDuration, parseIsoDate } from '@/lib/trips/dates';
import {
  ACCOMMODATION_OPTIONS,
  ACTIVITY_OPTIONS,
  SEASON_OPTIONS,
  TRANSPORT_OPTIONS,
} from '@/lib/trips/form-options';
import type { PackingTemplate } from '@/types/trip';

export type TripFormState = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  activity: string;
  season: string;
  accommodation: string;
  transport: string[];
  notes: string;
  templateId: string;
};

type TripFormFieldsProps = {
  state: TripFormState;
  onChange: (patch: Partial<TripFormState>) => void;
  onPlaceSelect?: (place: GeocodedDestination | null) => void;
  templates?: PackingTemplate[];
};

export function computedDurationDays(state: Pick<TripFormState, 'startDate' | 'endDate' | 'duration'>): number | null {
  const start = parseIsoDate(state.startDate);
  const end = parseIsoDate(state.endDate);
  if (start && end && end >= start) return daysBetween(start, end) || null;
  const nights = state.duration.trim() ? Number(state.duration) : null;
  if (nights && nights > 0) return nights;
  return null;
}

export function TripFormFields({ state, onChange, onPlaceSelect, templates }: TripFormFieldsProps) {
  const colors = useScrapbookPalette();
  const start = parseIsoDate(state.startDate);
  const end = parseIsoDate(state.endDate);
  const computed = start && end && end >= start ? daysBetween(start, end) : null;

  return (
    <>
      <PaperField
        label="what is this?"
        placeholder="Thailand, camping, sleepover…"
        value={state.title}
        onChangeText={(title) => onChange({ title })}
        autoCapitalize="sentences"
      />
      <PlaceAutocomplete
        label="where?"
        placeholder="Antalya, a friend's place…"
        value={state.destination}
        onChangeText={(destination) => onChange({ destination })}
        onSelect={onPlaceSelect}
        preferNearby={false}
      />
      <DateField
        label="start date"
        value={state.startDate}
        onChange={(startDate) => {
          const nextEnd = state.endDate && state.endDate < startDate ? startDate : state.endDate;
          onChange({ startDate, endDate: nextEnd });
        }}
      />
      <DateField
        label="end date"
        value={state.endDate}
        minimumDate={state.startDate || null}
        onChange={(endDate) => onChange({ endDate })}
      />
      {computed != null ? (
        <Text
          style={{
            ...readableFont,
            fontSize: readableType.meta.fontSize,
            color: colors.inkSoft,
            marginTop: -8,
            marginBottom: 14,
          }}>
          {formatDuration(computed)}
        </Text>
      ) : (
        <PaperField
          label="or duration in days"
          hint="if you skip dates"
          placeholder="8"
          value={state.duration}
          onChangeText={(duration) => onChange({ duration })}
          keyboardType="number-pad"
        />
      )}
      <Text style={{ ...readableFont, fontSize: readableType.meta.fontSize, color: colors.inkSoft, marginTop: 8 }}>
        activity
      </Text>
      <ChipRow options={ACTIVITY_OPTIONS} value={state.activity} onChange={(activity) => onChange({ activity })} />
      <Text style={{ ...readableFont, fontSize: readableType.meta.fontSize, color: colors.inkSoft, marginTop: 8 }}>
        season / climate
      </Text>
      <ChipRow options={SEASON_OPTIONS} value={state.season} onChange={(season) => onChange({ season })} />
      <Text style={{ ...readableFont, fontSize: readableType.meta.fontSize, color: colors.inkSoft, marginTop: 8 }}>
        accommodation
      </Text>
      <ChipRow
        options={ACCOMMODATION_OPTIONS}
        value={state.accommodation}
        onChange={(accommodation) => onChange({ accommodation })}
      />
      <Text style={{ ...readableFont, fontSize: readableType.meta.fontSize, color: colors.inkSoft, marginTop: 8 }}>
        transportation
      </Text>
      <ChipRow
        options={TRANSPORT_OPTIONS}
        value={state.transport}
        onChange={(option) =>
          onChange({
            transport: state.transport.includes(option)
              ? state.transport.filter((item) => item !== option)
              : [...state.transport, option],
          })
        }
        allowClear={false}
      />
      <PaperField
        label="notes"
        hint="optional"
        placeholder="anything else to remember"
        value={state.notes}
        onChangeText={(notes) => onChange({ notes })}
        autoCapitalize="sentences"
        multiline
      />
      {templates && templates.length > 0 ? (
        <>
          <Text style={{ ...readableFont, fontSize: readableType.meta.fontSize, color: colors.inkSoft, marginTop: 8 }}>
            template
          </Text>
          <ChipRow
            options={templates.map((item) => item.name)}
            value={templates.find((item) => item.id === state.templateId)?.name ?? ''}
            onChange={(name) => {
              const match = templates.find((item) => item.name === name);
              onChange({ templateId: match?.id ?? '' });
            }}
          />
        </>
      ) : null}
    </>
  );
}
