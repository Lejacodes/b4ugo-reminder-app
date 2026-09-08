import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { readableType, readableFont } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatHumanDate, parseIsoDate, toIsoDate, todayIso } from '@/lib/trips/dates';

import { QuietLink } from './QuietLink';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type DateFieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: string | null;
  maximumDate?: string | null;
};

function monthFromValue(value: string, fallback: string): { year: number; month: number } {
  const date = parseIsoDate(value) ?? parseIsoDate(fallback) ?? new Date();
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function mondayOffset(year: number, month: number): number {
  const weekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return (weekday + 6) % 7;
}

export function DateField({ label, hint, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const palette = useScrapbookPalette();
  const [open, setOpen] = useState(false);
  const initial = monthFromValue(value, minimumDate ?? todayIso());
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const cells = useMemo(() => {
    const blanks = mondayOffset(year, month);
    const count = daysInMonth(year, month);
    return [...Array(blanks).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [year, month]);

  const display = formatHumanDate(value);
  const today = todayIso();
  const min = parseIsoDate(minimumDate);
  const max = parseIsoDate(maximumDate);

  const openPicker = () => {
    const next = monthFromValue(value, minimumDate ?? todayIso());
    setYear(next.year);
    setMonth(next.month);
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  };

  const isDisabled = (day: number) => {
    const date = new Date(Date.UTC(year, month, day));
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: palette.inkSoft }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={display ? `${label}, ${display}` : `${label}, choose a date`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.line,
          { borderBottomColor: palette.line },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.value, { color: display ? palette.ink : palette.inkSoft }]}>
          {display ?? 'choose a date'}
        </Text>
      </Pressable>
      {hint ? <Text style={[styles.hint, { color: palette.inkSoft }]}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: palette.paper,
                borderColor: palette.line,
                shadowColor: palette.ink,
              },
            ]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.monthRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() => shiftMonth(-1)}
                style={styles.monthNav}>
                <Text style={[styles.monthNavLabel, { color: palette.ink }]}>‹</Text>
              </Pressable>
              <Text style={[styles.monthTitle, { color: palette.ink }]}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() => shiftMonth(1)}
                style={styles.monthNav}>
                <Text style={[styles.monthNavLabel, { color: palette.ink }]}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={[styles.weekday, { color: palette.inkSoft }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (day == null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const iso = toIsoDate(new Date(Date.UTC(year, month, day)));
                const selected = iso === value;
                const isToday = iso === today;
                const disabled = isDisabled(day);
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    disabled={disabled}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    style={[
                      styles.dayCell,
                      selected && { backgroundColor: palette.stickyButter },
                      disabled && styles.dayDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: selected ? palette.inkOnMatcha : palette.ink },
                        isToday && !selected && { color: palette.butterDeep },
                      ]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              {value ? <QuietLink label="clear" onPress={() => onChange('')} /> : <View />}
              <QuietLink label="close" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    fontWeight: '500',
    marginBottom: 2,
  },
  line: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    borderBottomWidth: 1,
    paddingBottom: 1,
  },
  value: {
    ...readableFont,
    fontSize: readableType.input.fontSize,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  hint: {
    ...readableFont,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 5,
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(40, 32, 24, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthNav: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavLabel: {
    ...readableFont,
    fontSize: 22,
    lineHeight: 26,
  },
  monthTitle: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
    ...readableFont,
    fontSize: readableType.helper.fontSize,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  dayLabel: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
  },
  dayDisabled: {
    opacity: 0.28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
