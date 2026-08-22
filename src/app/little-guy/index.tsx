import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { LittleGuy } from '@/components/little-guy/LittleGuy';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { isVisibleChatMessage } from '@/lib/ai/chat-session';
import { pixelsToParticles } from '@/lib/ai/pixels-to-particles';
import { useLittleGuy } from '@/store/LittleGuyProvider';

import '@/components/opening-login/opening-login.css';

export default function LittleGuyScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isCompact, isTablet } = useResponsive();
  const { messages, mood, whisper, pixels, suggestions, busy, send, addSuggestedItem } = useLittleGuy();
  const [draft, setDraft] = useState('');
  const guySize = isTablet ? 116 : isCompact ? 84 : 100;

  const submit = async () => {
    const text = draft;
    setDraft('');
    await send(text);
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
        <ScrapbookHeader title="little guy" />

        <View style={[styles.stage, { width: guySize, height: guySize * 1.18 }]}>
          <LittleGuy mood={mood} size={guySize} floating particles={pixelsToParticles(pixels)} />
        </View>
        <Handwriting variant="aside" tone="soft" style={styles.sign}>
          little guy ✦
        </Handwriting>
        {whisper ? <Text style={[styles.whisper, { color: colors.inkSoft }]}>{whisper}</Text> : null}

        <PaperPanel tilt="-0.6deg" tape="top-left">
          {messages.length === 0 ? (
            <Text style={[styles.line, { color: colors.ink }]}>hey ♡{'\n'}what's on your mind?</Text>
          ) : (
            messages.filter(isVisibleChatMessage).map((item, index) => (
              <Text
                key={`${item.role}-${index}`}
                style={[
                  styles.line,
                  { color: item.role === 'user' ? colors.inkSoft : colors.ink },
                  item.role === 'user' && styles.user,
                ]}>
                {item.role === 'user' ? `you · ${item.content}` : item.content}
              </Text>
            ))
          )}
          {busy ? <Text style={[styles.line, { color: colors.inkSoft }]}>thinking...</Text> : null}
        </PaperPanel>

        {suggestions.length > 0 ? (
          <PaperPanel tilt="0.8deg" tape="top-right">
            <Handwriting variant="aside">add if you want</Handwriting>
            {suggestions.slice(0, 8).map((item) => (
              <QuietLink
                key={item.title}
                label={`${item.title} · ${item.reason}`}
                onPress={() => addSuggestedItem(item.title)}
              />
            ))}
          </PaperPanel>
        ) : null}

        <PaperField
          placeholder="type something..."
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="sentences"
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <ButterButton label="tell him" busy={busy} disabled={draft.trim().length === 0} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
  },
  stage: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sign: {
    textAlign: 'center',
  },
  whisper: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    textAlign: 'center',
  },
  line: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 10,
  },
  user: {
    marginTop: 16,
  },
});
