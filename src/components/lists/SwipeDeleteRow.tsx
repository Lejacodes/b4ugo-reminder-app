import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SharedValue } from 'react-native-reanimated';
import type { ReactNode } from 'react';

import { palette } from '@/constants/colors';
import { readableFont } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

type SwipeDeleteRowProps = {
  children: ReactNode;
  onDelete?: () => void;
};

function DeleteAction(
  _progress: SharedValue<number>,
  _translation: SharedValue<number>,
  methods: SwipeableMethods,
  onDelete: () => void,
) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Delete"
      onPress={() => {
        methods.close();
        onDelete();
      }}
      style={styles.action}>
      <Text style={styles.actionLabel}>delete</Text>
    </Pressable>
  );
}

/**
 * Swipe left to reveal delete. When `onDelete` is omitted the row is static.
 */
export function SwipeDeleteRow({ children, onDelete }: SwipeDeleteRowProps) {
  if (!onDelete) return <View>{children}</View>;

  return (
    <Swipeable
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      renderRightActions={(progress, translation, methods) =>
        DeleteAction(progress, translation, methods, onDelete)
      }>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 88,
    minHeight: minTouchTarget,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mutedCoral,
  },
  actionLabel: {
    ...readableFont,
    color: palette.cream,
    fontSize: 14,
    fontWeight: '600',
  },
});
