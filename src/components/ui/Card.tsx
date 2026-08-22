import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/use-theme';

export type CardVariant = 'default' | 'muted' | 'elevated';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  /** @deprecated Use variant="elevated" instead. */
  elevated?: boolean;
};

export function Card({
  variant,
  elevated = false,
  style,
  children,
  accessibilityRole,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const resolvedVariant = variant ?? (elevated ? 'elevated' : 'default');

  const backgroundColor =
    resolvedVariant === 'muted'
      ? theme.surfaceMuted
      : resolvedVariant === 'elevated'
        ? theme.surfaceElevated
        : theme.surface;

  const borderColor = resolvedVariant === 'default' ? theme.border : theme.borderSubtle;

  return (
    <View
      accessibilityRole={accessibilityRole}
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
