import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { PaperPanel } from '@/components/scrapbook';
import { readableFont, readableType } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import {
  isLegalDocumentId,
  legalBusinessIsComplete,
  legalDocuments,
} from '@/content/legal';

export default function LegalDocumentScreen() {
  const params = useLocalSearchParams<{ document?: string | string[] }>();
  const colors = useScrapbookPalette();
  const desk = useDeskStyle();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet } = useResponsive();

  if (!isLegalDocumentId(params.document)) return <Redirect href="/auth/sign-in" />;
  const document = legalDocuments[params.document];

  return (
    <SafeAreaView style={desk} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + spacing.xl,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}>
        <ScrapbookHeader title={document.title.toLowerCase()} />
        <Text style={[styles.summary, { color: colors.inkSoft }]}>{document.summary}</Text>
        {!legalBusinessIsComplete ? (
          <View
            accessibilityRole="alert"
            style={[styles.releaseWarning, { borderColor: colors.ink, backgroundColor: colors.paperWarm }]}>
            <Text style={[styles.warningText, { color: colors.ink }]}>
              Release blocker: verified operator name, contact email, and business address are not configured.
            </Text>
          </View>
        ) : null}
        {document.sections.map((section) => (
          <PaperPanel key={section.heading} tilt="0deg">
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.ink }]}>
              {section.heading}
            </Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={[styles.body, { color: colors.ink }]}>
                {paragraph}
              </Text>
            ))}
          </PaperPanel>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  summary: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  releaseWarning: {
    borderWidth: 2,
    padding: 12,
  },
  warningText: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    fontWeight: '700',
  },
  heading: {
    ...readableFont,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: 24,
    marginBottom: 12,
  },
});
