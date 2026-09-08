import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, scrapbookPalette, tiltAt, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { tripHref } from '@/lib/trips/routes';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function TemplatesScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();
  const { templates, createTemplate, deleteTemplate } = useTrips();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await createTemplate(trimmed);
      setName('');
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
        <ScrapbookHeader title="templates" icon="copy-outline" />
        {templates.map((template, index) => (
          <Pressable
            key={template.id}
            accessibilityRole="button"
            accessibilityLabel={`${template.name}. ${template.items.length} items. Open.`}
            onPress={() => router.push(tripHref(`/trip/templates/${template.id}`))}
            style={({ pressed }) => pressed && styles.pressed}>
            <PaperPanel tilt={tiltAt(index)} tape={index % 2 ? 'top-right' : 'top-left'}>
              <Handwriting variant="title">{template.name}</Handwriting>
              <Text style={[styles.meta, { color: colors.inkSoft }]}>{template.items.length} items</Text>
              <QuietLink label="delete" onPress={() => deleteTemplate(template.id)} />
            </PaperPanel>
          </Pressable>
        ))}

        <PaperPanel tilt={tiltAt(4)} tape="top-left">
          <Handwriting variant="aside">new template</Handwriting>
          <PaperField
            placeholder="Festival weekend…"
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
          />
          <View style={styles.actions}>
            <ButterButton
              label="create"
              busy={busy}
              disabled={name.trim().length === 0}
              onPress={add}
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
    marginTop: 4,
  },
  actions: {
    marginTop: 8,
  },
  pressed: {
    opacity: 0.88,
  },
});
