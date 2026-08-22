import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { DISPLAY_FONT, scrapbookType } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type HandwritingProps = {
  children: string;
  variant?: keyof typeof scrapbookType;
  tone?: 'ink' | 'soft';
  style?: StyleProp<TextStyle>;
  accessibilityRole?: 'header' | 'text';
};

/**
 * Starry Night text at the scrapbook sizes — headings and short asides.
 * Anything a reader has to parse exactly belongs in the system face instead;
 * see the note on the typefaces in `constants/scrapbook.ts`.
 */
export function Handwriting({
  children,
  variant = 'body',
  tone = 'ink',
  style,
  accessibilityRole,
}: HandwritingProps) {
  const palette = useScrapbookPalette();

  return (
    <Text
      accessibilityRole={accessibilityRole}
      style={[
        styles.base,
        scrapbookType[variant],
        { color: tone === 'soft' ? palette.inkSoft : palette.ink },
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: DISPLAY_FONT,
  },
});
