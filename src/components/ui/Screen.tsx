import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = ViewProps & {
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  /** Extra bottom padding for tab bar clearance. */
  withTabBarInset?: boolean;
  centered?: boolean;
};

export function Screen({
  scroll = false,
  scrollProps,
  withTabBarInset = true,
  centered = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const bottomPadding = withTabBarInset ? tabBarInset : spacing.lg;

  const contentStyle = [
    styles.content,
    {
      paddingHorizontal: horizontalPadding,
      paddingBottom: bottomPadding,
      maxWidth: isTablet ? maxContentWidth : undefined,
      alignSelf: isTablet ? ('center' as const) : undefined,
      width: isTablet ? ('100%' as const) : undefined,
    },
    centered && styles.centered,
    style,
  ];

  if (scroll) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={['top']}>
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          {...scrollProps}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}
      {...rest}>
      <View style={contentStyle}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
  },
});
