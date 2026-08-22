import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LittleGuy } from '@/components/little-guy';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';

export default function HomeScreen() {
  const router = useRouter();
  const { contentWidth, isCompact } = useResponsive();

  return (
    <Screen scroll>
      <View
        style={[styles.container, { maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <LittleGuy
            size={isCompact ? 76 : 84}
            expression="happy"
            floating
            showParticles
            blinking
          />
          <AppText variant="heading" style={styles.greeting}>
            Hey! What should I remember for you?
          </AppText>
        </View>

        <Card variant="default" style={styles.remindersCard}>
          <AppText variant="title" style={styles.cardTitle}>
            Coming up
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.emptyText}>
            Nothing coming up yet.
          </AppText>
        </Card>

        <View style={styles.action}>
          <Button
            label="Add a reminder"
            variant="primary"
            size="medium"
            accessibilityLabel="Add a reminder"
            onPress={() => router.push('/(tabs)/add')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  heroCompact: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  greeting: {
    textAlign: 'center',
    maxWidth: 300,
  },
  remindersCard: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: {
    marginBottom: spacing.xxs,
  },
  emptyText: {},
  action: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
