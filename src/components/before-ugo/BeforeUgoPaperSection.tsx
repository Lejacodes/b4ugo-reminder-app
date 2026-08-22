import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Handwriting, PaperPanel } from '@/components/scrapbook';
import { readableType, scrapbookPalette, TEXT_FONT, tiltAt } from '@/constants/scrapbook';

type BeforeUgoPaperSectionProps = {
  title: string;
  aside?: string;
  /** Extra readable line under the title, e.g. "going to university". */
  context?: string;
  tape?: 'top-left' | 'top-right' | 'none';
  tiltIndex?: number;
  children: ReactNode;
};

/**
 * One paper sheet on the Before U Go desk. The sheet is not a button —
 * only the checklist rows inside are tappable.
 */
export function BeforeUgoPaperSection({
  title,
  aside,
  context,
  tape = 'none',
  tiltIndex = 0,
  children,
}: BeforeUgoPaperSectionProps) {
  return (
    <PaperPanel tilt={tiltAt(tiltIndex)} tape={tape} contentStyle={styles.panel}>
      <Handwriting variant="title" accessibilityRole="header">
        {title}
      </Handwriting>
      {context ? <Text style={styles.context}>{context}</Text> : null}
      {aside ? (
        <Handwriting variant="aside" tone="soft" style={styles.aside}>
          {aside}
        </Handwriting>
      ) : null}
      <View style={styles.body}>{children}</View>
    </PaperPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingTop: 20,
    paddingBottom: 14,
  },
  context: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 4,
  },
  aside: {
    marginTop: 4,
  },
  body: {
    marginTop: 10,
  },
});
