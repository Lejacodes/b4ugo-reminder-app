import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, preferences, resetAll } = usePreferences();
  const { user, signOut } = useAuth();

  return (
    <Screen scroll>
      <View style={styles.content}>
        <AppText variant="heading">Profile</AppText>
        {profile.displayName && (
          <AppText variant="body" color="textSecondary">
            {profile.displayName}
          </AppText>
        )}
        {user && (
          <AppText variant="caption" color="textSecondary">
            Signed in as {user.email}
          </AppText>
        )}

        <Card variant="default" style={styles.card}>
          <AppText variant="title">Preferences</AppText>
          <AppText variant="body" color="textSecondary" style={styles.cardRow}>
            Context-aware: {preferences.reminders.preferContextual ? 'On' : 'Off'}
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.cardRow}>
            Routines: {preferences.reminders.routineRemindersEnabled ? 'On' : 'Off'}
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.cardRow}>
            AI parsing: {preferences.privacy.aiParsingEnabled ? 'On' : 'Off'}
          </AppText>
        </Card>

        {!preferences.hasCompletedOnboarding && (
          <Button
            label="Complete setup"
            variant="primary"
            accessibilityLabel="Complete onboarding setup"
            onPress={() => router.push('/onboarding')}
            style={styles.action}
          />
        )}

        <Button
          label="Log out"
          variant="ghost"
          accessibilityLabel="Log out of your account"
          onPress={signOut}
          style={styles.action}
        />

        {__DEV__ && (
          <Button
            label="Reset onboarding (dev)"
            variant="ghost"
            accessibilityLabel="Reset onboarding for development"
            onPress={resetAll}
            style={styles.action}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  card: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  cardRow: {
    marginTop: spacing.xxs,
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
});
