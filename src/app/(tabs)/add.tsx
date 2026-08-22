import { StyleSheet, View } from 'react-native';

import { LittleGuy } from '@/components/little-guy';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { spacing } from '@/constants/spacing';

export default function AddScreen() {
  return (
    <Screen centered>
      <View style={styles.content}>
        <LittleGuy size={72} expression="curious" floating />
        <AppText variant="heading">Add</AppText>
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
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
});

