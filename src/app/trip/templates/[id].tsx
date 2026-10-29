import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChipRow } from '@/components/trips';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, tiltAt, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { titlesMatch } from '@/types/reminder';
import {
  PACKING_CATEGORIES,
  PACKING_CATEGORY_LABELS,
  type PackingCategory,
  type PackingTemplateItem,
} from '@/types/trip';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function TemplateDetailScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { templates, renameTemplate, replaceTemplateItems } = useTrips();
  const template = templates.find((item) => item.id === id);

  const [name, setName] = useState(template?.name ?? '');
  const [items, setItems] = useState<PackingTemplateItem[]>(template?.items ?? []);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PackingCategory>('other');
  const [busy, setBusy] = useState(false);

  if (!template) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="template" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this template isn’t here</Text>
      </SafeAreaView>
    );
  }

  const persist = async (nextItems: PackingTemplateItem[], nextName = name) => {
    setBusy(true);
    try {
      if (nextName.trim() && nextName.trim() !== template.name) {
        await renameTemplate(template.id, nextName);
      }
      await replaceTemplateItems(template.id, nextItems);
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
        <ScrapbookHeader title="template" />
        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <PaperField label="name" value={name} onChangeText={setName} />
          <ButterButton
            label="rename"
            busy={busy}
            disabled={name.trim().length === 0}
            onPress={() => persist(items, name)}
          />
        </PaperPanel>

        <PaperPanel tilt={tiltAt(1)} tape="top-right">
          <Handwriting variant="title">items</Handwriting>
          {items.length === 0 ? (
            <Text style={[styles.meta, { color: colors.inkSoft }]}>empty</Text>
          ) : (
            items.map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.row}>
                <Text style={[styles.item, { color: colors.ink }]}>
                  {item.title}
                  <Text style={[styles.meta, { color: colors.inkSoft }]}> · {PACKING_CATEGORY_LABELS[item.category]}</Text>
                </Text>
                <QuietLink
                  label="remove"
                  onPress={() => {
                    const next = items.filter((_, itemIndex) => itemIndex !== index);
                    setItems(next);
                    persist(next);
                  }}
                />
              </View>
            ))
          )}
        </PaperPanel>

        <PaperPanel tilt={tiltAt(2)} tape="top-left">
          <Text style={[styles.fieldLabel, { color: colors.ink, marginTop: 0, fontWeight: '500' }]}>
            add an item
          </Text>
          <PaperField value={title} onChangeText={setTitle} placeholder="Towel" />
          <ChipRow
            options={PACKING_CATEGORIES.map((key) => PACKING_CATEGORY_LABELS[key])}
            value={PACKING_CATEGORY_LABELS[category]}
            onChange={(label) => {
              const match = PACKING_CATEGORIES.find((key) => PACKING_CATEGORY_LABELS[key] === label);
              if (match) setCategory(match);
            }}
            allowClear={false}
          />
          <View style={styles.actions}>
            <ButterButton
              label="add"
              disabled={title.trim().length === 0}
              onPress={() => {
                const trimmed = title.trim();
                if (!trimmed || items.some((item) => titlesMatch(item.title, trimmed))) return;
                const next = [...items, { title: trimmed, category }];
                setItems(next);
                setTitle('');
                persist(next);
              }}
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
    paddingTop: spacing.sm,
    gap: spacing.lg,
    width: '100%',
  },
  meta: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
  },
  fieldLabel: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 14,
  },
  item: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    color: scrapbookPalette.ink,
    flex: 1,
  },
  row: {
    marginTop: 8,
  },
  actions: {
    marginTop: 12,
  },
});
