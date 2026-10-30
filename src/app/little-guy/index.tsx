import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ChatBubble } from '@/components/little-guy/ChatBubble';
import { LittleGuy } from '@/components/little-guy/LittleGuy';
import { ButterButton, Handwriting, PaperField, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, readableFont } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
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
  const { listening, error: voiceError, onPressIn, onPressOut } = useHoldToSpeak({
    onTranscript: (spoken) => setDraft(spoken),
  });

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    if (await send(text)) setDraft((current) => (current.trim() === text ? '' : current));
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
          <LittleGuy
            mood={mood}
            size={guySize}
            floating
            particles={pixelsToParticles(pixels)}
            accessibilityLabel={`Little Guy is ${mood}`}
          />
        </View>
        <Handwriting variant="aside" tone="soft" style={styles.sign}>
          little guy ✦
        </Handwriting>
        {whisper ? (
          <Handwriting variant="aside" tone="soft" style={styles.whisper}>
            {whisper}
          </Handwriting>
        ) : null}

        <PaperPanel tilt="-0.6deg" tape="top-left">
          <View style={styles.chat}>
            {messages.length === 0 ? (
              <ChatBubble role="assistant" content={"hey ♡\nwhat's on your mind?"} colors={colors} />
            ) : (
              messages.filter(isVisibleChatMessage).map((item, index) => (
                <ChatBubble
                  key={`${item.role}-${index}`}
                  role={item.role === 'user' ? 'user' : 'assistant'}
                  content={item.content}
                  colors={colors}
                />
              ))
            )}
            {busy ? (
              <View style={styles.thinkingRow}>
                <View style={[styles.thinkingBubble, { backgroundColor: colors.paper, borderColor: colors.line }]}>
                  <Text style={[styles.thinkingText, { color: colors.inkSoft }]}>thinking...</Text>
                </View>
              </View>
            ) : null}
          </View>
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

        <View style={styles.captureRow}>
          <View style={styles.field}>
            <PaperField
              placeholder="type something..."
              value={draft}
              onChangeText={setDraft}
              autoCapitalize="sentences"
              onSubmitEditing={submit}
              returnKeyType="send"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Listening. Release to stop.' : 'Hold to speak'}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={({ pressed }) => [
              styles.mic,
              {
                backgroundColor: listening || pressed ? colors.stickyButter : colors.paperWarm,
                borderColor: listening ? colors.ink : colors.line,
              },
            ]}>
            <Ionicons name={listening ? 'mic' : 'mic-outline'} size={22} color={colors.ink} />
          </Pressable>
        </View>
        {listening ? (
          <Text style={[styles.listening, { color: colors.inkSoft }]}>listening…</Text>
        ) : null}
        {voiceError ? (
          <Text style={[styles.listening, { color: colors.inkSoft }]}>{voiceError}</Text>
        ) : null}
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
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
  },
  chat: {
    width: '100%',
    paddingVertical: 4,
  },
  thinkingRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  thinkingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  thinkingText: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  mic: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  listening: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
});
