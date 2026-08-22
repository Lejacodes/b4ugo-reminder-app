import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistItem } from '@/components/before-ugo/ChecklistItem';
import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChipRow } from '@/components/trips';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { formatPackedProgress } from '@/lib/trips/copy';
import { PACKING_CATEGORIES, PACKING_CATEGORY_LABELS, type PackingCategory } from '@/types/trip';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

const SOURCE_LABEL: Record<string, string> = {
  user: 'yours',
  generated: 'suggested',
  template: 'template',
};

export default function PackingScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const {
    getTrip,
    packingFor,
    packingProgress,
    templates,
    togglePackingItem,
    addPackingItem,
    updatePackingItem,
    deletePackingItem,
    dismissPackingItem,
    regeneratePacking,
    applyTemplate,
  } = useTrips();

  const trip = getTrip(id);
  const items = packingFor(id);
  const progress = packingProgress(id);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PackingCategory>('other');
  const [busy, setBusy] = useState(false);
  const [listEditing, setListEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!trip) {
    return (
      <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
        <ScrapbookHeader title="packing" />
        <Text style={[styles.meta, { color: colors.inkSoft }]}>this trip isn't here</Text>
      </SafeAreaView>
    );
  }

  const add = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await addPackingItem(trip.id, trimmed, category);
      setTitle('');
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
        <ScrapbookHeader title="packing" icon="briefcase-outline" />
        <Text style={[styles.count, { color: colors.ink }]}>{formatPackedProgress(progress.packed, progress.total)}</Text>
        <Text style={[styles.meta, { color: colors.inkSoft }]}>
          packed for this trip only
        </Text>
        {items.length > 0 ? (
          <QuietLink
            label={listEditing ? 'done' : 'edit list'}
            accessibilityLabel={listEditing ? 'Finish editing packing list' : 'Edit packing list'}
            onPress={() => {
              setListEditing((current) => !current);
              setEditingId(null);
            }}
          />
        ) : null}
        {listEditing ? (
          <Text style={[styles.meta, { color: colors.inkSoft }]}>tap an item to rename or remove it</Text>
        ) : null}

        {PACKING_CATEGORIES.map((key, index) => {
          const group = items.filter((item) => item.category === key);
          if (group.length === 0) return null;
          return (
            <PaperPanel key={key} tilt={tiltAt(index)} tape={index % 2 ? 'top-right' : 'top-left'}>
              <Handwriting variant="title">{PACKING_CATEGORY_LABELS[key]}</Handwriting>
              {group.map((item) => (
                <View key={item.id}>
                  <ChecklistItem
                    title={item.title}
                    reason={item.reason ?? SOURCE_LABEL[item.source]}
                    checked={item.checked}
                    onToggle={() => {
                      if (listEditing) {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                        return;
                      }
                      togglePackingItem(item.id);
                    }}
                  />
                  {listEditing && editingId === item.id ? (
                    <View>
                      <PaperField
                        value={editTitle}
                        onChangeText={setEditTitle}
                        autoCapitalize="sentences"
                      />
                      <View style={styles.rowActions}>
                        <QuietLink
                          label="save name"
                          onPress={async () => {
                            await updatePackingItem(item.id, { title: editTitle });
                            setEditingId(null);
                          }}
                        />
                        <QuietLink
                          label={item.source === 'user' ? 'remove' : 'reject suggestion'}
                          onPress={() =>
                            item.source === 'user'
                              ? deletePackingItem(item.id)
                              : dismissPackingItem(item.id)
                          }
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </PaperPanel>
          );
        })}

        {items.length === 0 ? (
          <PaperPanel tilt={tiltAt(1)} tape="top-left">
            <Text style={[styles.fieldLabel, { color: colors.inkSoft, marginTop: 0 }]}>nothing yet</Text>
          </PaperPanel>
        ) : null}

        <PaperPanel tilt={tiltAt(5)} tape="top-right">
          <Handwriting variant="aside">add something</Handwriting>
          <PaperField
            placeholder="Passport, adapter…"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>category</Text>
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
            <ButterButton label="add" busy={busy} disabled={title.trim().length === 0} onPress={add} />
          </View>
        </PaperPanel>

        <QuietLink
          label="regenerate suggestions"
          accessibilityLabel="Add more packing suggestions without removing your items"
          onPress={() => regeneratePacking(trip.id)}
        />
        {templates.length > 0 ? (
          <>
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>merge a template</Text>
            {templates.map((template) => (
              <QuietLink
                key={template.id}
                label={`use ${template.name}`}
                onPress={() => applyTemplate(trip.id, template.id)}
              />
            ))}
          </>
        ) : null}
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
    gap: spacing.md,
    width: '100%',
  },
  count: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.count.fontSize,
    lineHeight: readableType.count.lineHeight,
    color: scrapbookPalette.ink,
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
  },
  fieldLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    color: scrapbookPalette.inkSoft,
    marginTop: 8,
  },
  actions: {
    marginTop: 12,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
  fine: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 8,
  },
});
