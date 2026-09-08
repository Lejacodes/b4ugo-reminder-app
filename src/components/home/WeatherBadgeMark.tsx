import { Feather } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readableFont } from '@/constants/scrapbook';
import type { WeatherBadgeIcon } from '@/lib/context/weather-injections';

type WeatherBadgeMarkProps = {
  label: string;
  icon?: WeatherBadgeIcon | null;
  ink: string;
  background: string;
  border: string;
  onPress?: () => void;
  disabled?: boolean;
};

const ICON: Record<WeatherBadgeIcon, ComponentProps<typeof Feather>['name']> = {
  rain: 'cloud-rain',
  cold: 'thermometer',
  sun: 'sun',
  weather: 'cloud',
};

export function WeatherBadgeMark({
  label,
  icon,
  ink,
  background,
  border,
  onPress,
  disabled,
}: WeatherBadgeMarkProps) {
  const glyph = icon ? ICON[icon] : null;
  const body = (
    <View style={[styles.badge, { backgroundColor: background, borderColor: border }]}>
      {glyph ? <Feather name={glyph} size={11} color={ink} /> : null}
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Dismiss ${label}`}
      onPress={onPress}
      disabled={disabled}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 10,
  },
  label: {
    ...readableFont,
    fontSize: 11,
    lineHeight: 14,
  },
});
