import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ButterButton,
  DeskScreen,
  Handwriting,
  QuietLink,
  StickyNote,
} from '@/components/scrapbook';
import { scrapbookPalette, stickyColors, tiltAt } from '@/constants/scrapbook';
import { usePreferences } from '@/store/PreferencesProvider';
import { interestOptions, type OnboardingInterest } from '@/types';

/**
 * A corkboard of sticky notes rather than a form.
 *
 * Everything here is optional and everything is coarse — no dates, no
 * locations, no free text. The answers only shape which reminders BLUGO
 * suggests, so nothing sensitive needs collecting to make it useful.
 */
export default function GettingToKnowYouScreen() {
  const router = useRouter();
  const { profile, updateProfile, completeOnboarding } = usePreferences();
  const [picked, setPicked] = useState<OnboardingInterest[]>(profile.interests);
  const [saving, setSaving] = useState(false);

  const toggle = (id: OnboardingInterest) => {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const finish = async (interests: OnboardingInterest[]) => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ interests });
      await completeOnboarding();
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const greeting = profile.displayName ? `nice to meet you, ${profile.displayName}.` : 'nice to meet you.';

  return (
    <DeskScreen scroll>
      <View style={styles.header}>
        <Handwriting variant="heading" accessibilityRole="header">
          {greeting}
        </Handwriting>
        <Handwriting variant="aside" tone="soft" style={styles.subtitle}>
          what should I keep an eye on? pick as many as you like.
        </Handwriting>
      </View>

      <View style={styles.board}>
        <Text style={[styles.pin, styles.pinLeft]}>★</Text>
        <Text style={[styles.pin, styles.pinRight]}>✿</Text>

        <View style={styles.notes}>
          {interestOptions.map((option, index) => (
            <StickyNote
              key={option.id}
              label={option.label}
              aside={option.aside}
              color={stickyColors[index % stickyColors.length]}
              tilt={tiltAt(index)}
              selected={picked.includes(option.id)}
              onToggle={() => toggle(option.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <ButterButton
          label="all done"
          accessibilityLabel="Save choices and finish setup"
          busy={saving}
          onPress={() => finish(picked)}
        />
        <QuietLink
          label="skip for now"
          accessibilityLabel="Skip setup questions"
          disabled={saving}
          onPress={() => finish([])}
        />
      </View>

      <Handwriting variant="aside" tone="soft" style={styles.fineprint}>
        you can change any of this later.
      </Handwriting>
    </DeskScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 14,
    marginBottom: 20,
    paddingLeft: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  board: {
    paddingVertical: 8,
  },
  notes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  pin: {
    position: 'absolute',
    color: scrapbookPalette.butter,
    zIndex: 1,
  },
  pinLeft: {
    top: -6,
    left: -2,
    fontSize: 18,
    transform: [{ rotate: '-16deg' }],
  },
  pinRight: {
    bottom: -12,
    right: 4,
    fontSize: 15,
    color: scrapbookPalette.doodle,
    opacity: 0.45,
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fineprint: {
    marginTop: 14,
    paddingLeft: 4,
  },
});
