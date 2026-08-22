import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { minTouchTarget } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'medium' | 'large';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const backgroundColor = isPrimary
    ? theme.primary
    : isSecondary
      ? theme.surface
      : 'transparent';

  const borderColor = isSecondary ? theme.border : 'transparent';
  const labelColor = isPrimary ? 'textOnPrimary' : isSecondary ? 'text' : 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : styles.medium,
        {
          backgroundColor: disabled ? theme.surfaceMuted : backgroundColor,
          borderColor: disabled ? theme.borderSubtle : borderColor,
          opacity: pressed && !disabled ? 0.9 : 1,
        },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      {...rest}>
      <AppText
        variant="button"
        color={disabled ? 'textDisabled' : labelColor}
        style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTouchTarget,
  },
  large: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  ghost: {
    borderWidth: 0,
    paddingHorizontal: spacing.md,
  },
  label: {
    textAlign: 'center',
  },
});
