import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, tabBarContentHeight } from '@/constants/spacing';

/**
 * Total bottom inset needed to clear the tab bar + home indicator + breathing room.
 */
export function useTabBarInset(extraSpacing = spacing.md): number {
  const insets = useSafeAreaInsets();
  return tabBarContentHeight + insets.bottom + extraSpacing;
}
