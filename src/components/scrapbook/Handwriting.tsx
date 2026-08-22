import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { DISPLAY_FONT, scrapbookPalette, scrapbookType } from '@/constants/scrapbook';

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
  return (
    <Text
      accessibilityRole={accessibilityRole}
      style={[
        styles.base,
        scrapbookType[variant],
        tone === 'soft' && styles.soft,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: DISPLAY_FONT,
    color: scrapbookPalette.ink,
  },
  soft: {
    color: scrapbookPalette.inkSoft,
  },
});
