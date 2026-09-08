import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ButterButton,
  DeskScreen,
  Handwriting,
  PaperField,
  PaperPanel,
} from '@/components/scrapbook';
import { readableType, scrapbookPalette, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { usePreferences } from '@/store/PreferencesProvider';

const MAX_NAME_LENGTH = 40;

/**
 * Asked once, after the account exists. The answer is profile data keyed to
 * the signed-in user, so returning users are never asked again — and it can
 * be changed later from Profile.
 */
export default function OnboardingNameScreen() {
  const router = useRouter();
  const colors = useScrapbookPalette();
  const { profile, updateProfile } = usePreferences();
  const [name, setName] = useState(profile.displayName ?? '');

  const trimmed = name.trim();

  const handleContinue = async () => {
    await updateProfile({ displayName: trimmed.length > 0 ? trimmed : null });
    router.push('/onboarding/getting-to-know-you');
  };

  return (
    <DeskScreen scroll>
      <View style={styles.stage}>
        <Text style={styles.star}>★</Text>

        <PaperPanel tilt="-1.6deg" tape="top-left" contentStyle={styles.card}>
          <Handwriting variant="heading" accessibilityRole="header">
            what should I call you?
          </Handwriting>
          <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
            just a name for the top of the page.
          </Text>

          <PaperField
            accessibilityLabel="Your name"
            placeholder="your name"
            variant="handwritten"
            value={name}
            onChangeText={setName}
            maxLength={MAX_NAME_LENGTH}
            autoCapitalize="words"
            autoComplete="off"
            textContentType="none"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <ButterButton
            label={trimmed.length > 0 ? "that's me" : 'skip for now'}
            accessibilityLabel={trimmed.length > 0 ? 'Save name and continue' : 'Continue without a name'}
            onPress={handleContinue}
          />
        </PaperPanel>

        <Text style={styles.flower}>✿</Text>
      </View>
    </DeskScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  card: {
    paddingTop: 26,
    paddingBottom: 24,
  },
  subtitle: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 2,
    marginBottom: 22,
  },
  star: {
    alignSelf: 'flex-end',
    marginRight: 18,
    marginBottom: 10,
    fontSize: 20,
    color: scrapbookPalette.butter,
    transform: [{ rotate: '14deg' }],
  },
  flower: {
    alignSelf: 'flex-start',
    marginLeft: 22,
    marginTop: 18,
    fontSize: 16,
    color: scrapbookPalette.doodle,
    opacity: 0.4,
  },
});
