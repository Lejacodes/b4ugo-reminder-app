import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { usePreferences } from '@/store/PreferencesProvider';

function PreferenceToggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.85 }]}>
      <AppText variant="bodyMedium" style={styles.toggleLabel}>
        {label}
      </AppText>
      <AppText variant="caption" color={value ? 'primary' : 'textSecondary'}>
        {value ? 'On' : 'Off'}
      </AppText>
    </Pressable>
  );
}

export default function OnboardingPreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const { reminders, privacy, notifications } = preferences;

  const handleContinue = () => {
    router.push('/onboarding/complete');
  };

  return (
    <Screen scroll withTabBarInset={false}>
      <View style={styles.content}>
        <AppText variant="heading">How should I help?</AppText>

        <Card variant="muted" style={styles.card}>
          <PreferenceToggle
            label="Push notifications"
            value={notifications.pushEnabled}
            onToggle={async () => {
              const next = !notifications.pushEnabled;
              if (next) await appNotificationService.requestPermission();
              await updatePreferences({
                notifications: { ...notifications, pushEnabled: next },
              });
            }}
          />
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
          <PreferenceToggle
            label="Context-aware reminders"
            value={reminders.preferContextual}
            onToggle={() =>
              updatePreferences({
                reminders: {
                  ...reminders,
                  preferContextual: !reminders.preferContextual,
                },
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
          <PreferenceToggle
            label="Routine-based reminders"
            value={reminders.routineRemindersEnabled}
            onToggle={() =>
              updatePreferences({
                reminders: {
                  ...reminders,
                  routineRemindersEnabled: !reminders.routineRemindersEnabled,
                },
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
          <PreferenceToggle
            label="Cloud AI-assisted parsing"
            value={privacy.aiParsingEnabled}
            onToggle={() =>
              updatePreferences({
                privacy: { ...privacy, aiParsingEnabled: !privacy.aiParsingEnabled },
              })
            }
          />
          <AppText variant="caption" color="textSecondary">
            When on, your message and relevant reminder or trip context are sent to the configured AI service. Leave off to use on-device parsing only.
          </AppText>
        </Card>

        <Button
          label="Continue"
          variant="primary"
          accessibilityLabel="Continue to finish onboarding"
          onPress={handleContinue}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    marginTop: spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 44,
  },
  toggleLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  button: {
    alignSelf: 'center',
  },
});
