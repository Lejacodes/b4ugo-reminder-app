import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';

export default function RemindersScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="heading">Reminders</AppText>
        <AppText variant="body" color="textSecondary">
          Coming soon.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
