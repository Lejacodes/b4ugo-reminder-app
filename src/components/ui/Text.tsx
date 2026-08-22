import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { fontFamily } from '@/constants/typography';
import { ThemeColor } from '@/constants/theme';
import { TextVariant, textVariants } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ThemeColor;
  style?: TextStyle;
};

export function AppText({
  variant = 'body',
  color = 'text',
  style,
  allowFontScaling = true,
  maxFontSizeMultiplier = 1.4,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const variantStyle = textVariants[variant];

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        {
          color: theme[color],
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          fontWeight: variantStyle.fontWeight as TextStyle['fontWeight'],
          fontFamily: fontFamily.sans,
          letterSpacing: variantStyle.letterSpacing,
        },
        style,
      ]}
      {...rest}
    />
  );
}
