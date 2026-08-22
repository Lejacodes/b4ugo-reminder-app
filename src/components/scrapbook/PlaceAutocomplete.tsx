import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import {
  formatPlaceLabel,
  geocodingService,
  type GeocodedDestination,
} from '@/lib/geocoding';

import { PaperField } from './PaperField';

type PlaceAutocompleteProps = {
  label?: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelect?: (place: GeocodedDestination | null) => void;
};

export function PlaceAutocomplete({
  label,
  hint,
  placeholder,
  value,
  onChangeText,
  onSelect,
}: PlaceAutocompleteProps) {
  const palette = useScrapbookPalette();
  const [suggestions, setSuggestions] = useState<GeocodedDestination[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const results = await geocodingService.searchPlaces(query);
        if (current !== requestId.current) return;
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        if (current !== requestId.current) return;
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <View style={styles.wrap}>
      <PaperField
        label={label}
        hint={hint}
        placeholder={placeholder}
        value={value}
        onChangeText={(next) => {
          onChangeText(next);
          onSelect?.(null);
          setOpen(true);
        }}
        autoCapitalize="sentences"
        autoCorrect={false}
        accessibilityLabel={label ?? 'Place'}
      />
      {open && suggestions.length > 0 ? (
        <View
          style={[
            styles.list,
            {
              backgroundColor: palette.paper,
              borderColor: palette.line,
              shadowColor: palette.ink,
            },
          ]}>
          {suggestions.map((place, index) => {
            const labelText = formatPlaceLabel(place);
            return (
              <Pressable
                key={`${place.latitude}-${place.longitude}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={labelText}
                onPress={() => {
                  onChangeText(labelText);
                  onSelect?.(place);
                  setSuggestions([]);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: palette.line },
                  index === suggestions.length - 1 && styles.rowLast,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{place.placeName}</Text>
                {place.country || place.region ? (
                  <Text style={[styles.rowMeta, { color: palette.inkSoft }]}>
                    {[place.region !== place.placeName ? place.region : null, place.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
  },
  list: {
    marginTop: -12,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  rowMeta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
