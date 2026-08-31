import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LittleGuy } from '@/components/little-guy';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { usePreferences } from '@/store/PreferencesProvider';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { profile, preferences, completeOnboarding } = usePreferences();
  const greeting = profile.displayName ? `You're all set, ${profile.displayName}!` : "You're all set!";

  const handleFinish = async () => {
    if (preferences.notifications.pushEnabled) {
      await appNotificationService.requestPermission();
    }
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen centered withTabBarInset={false}>
      <View style={styles.content}>
        <LittleGuy size={84} expression="happy" floating />
        <AppText variant="heading" style={styles.title}>
          {greeting}
        </AppText>
        <Button
          label="Go to Home"
          variant="primary"
          accessibilityLabel="Finish onboarding and go to home"
          onPress={handleFinish}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
});
