/**
 * Tokens for the scrapbook screens that follow the opening window —
 * account creation, log in, name, and "getting to know you".
 *
 * Built on the opening palette so everything reads as the same desk, with a
 * few extras the opening window never needed (sticky notes, error slips).
 * The opening tokens are re-exported rather than redefined, and nothing here
 * feeds back into Window 1.
 */
import { openingPalette, STARRY_NIGHT_FONT } from './opening';
import { fontFamily } from './typography';

export { openingPalette, STARRY_NIGHT_FONT };

export const scrapbookPalette = {
  ...openingPalette,
  blush: '#F1D2D6',
  blushDeep: '#DDA9B2',
  stickyButter: '#F3DE9E',
  stickyBlush: '#F2D4D7',
  stickyCream: '#F5EEDB',
  stickyEdge: 'rgba(92, 58, 40, 0.16)',
  slipInk: '#8C4A45',
  slip: '#F6DEDA',
} as const;

/** Sticky notes cycle through these so a grid never looks uniform. */
export const stickyColors = [
  scrapbookPalette.stickyButter,
  scrapbookPalette.stickyBlush,
  scrapbookPalette.stickyCream,
] as const;

/**
 * Small rotations applied round-robin. Nothing on the desk sits perfectly
 * straight, but the tilt stays under a couple of degrees so text is readable.
 */
export const paperTilts = ['-1.4deg', '1.1deg', '-0.7deg', '1.8deg', '-2deg', '0.9deg'] as const;

export function tiltAt(index: number): string {
  return paperTilts[index % paperTilts.length];
}

/**
 * Two typefaces, and the split between them is deliberate.
 *
 * Starry Night is the voice of the app: the wordmark, headings, sticky-note
 * labels, button faces, short asides. It is a handwriting face, so it is only
 * ever used where a misread costs nothing.
 *
 * The system sans takes everything a person has to read exactly or check
 * character by character — email addresses, passwords, error text, password
 * rules, and any explanation longer than a phrase. Getting one of those wrong
 * because an 'l' looked like a '1' is a real failure, and no amount of charm
 * is worth it.
 */
export const DISPLAY_FONT = STARRY_NIGHT_FONT;
export const TEXT_FONT = fontFamily.sans;

/** Starry Night sizes. Decorative text only. */
export const scrapbookType = {
  display: { fontSize: 38, lineHeight: 46 },
  heading: { fontSize: 30, lineHeight: 38 },
  title: { fontSize: 24, lineHeight: 30 },
  body: { fontSize: 20, lineHeight: 26 },
  aside: { fontSize: 17, lineHeight: 23 },
} as const;

/**
 * System-sans sizes for readability-first text. Smaller numbers than the
 * handwriting scale because a sans face reads larger at the same point size.
 */
export const readableType = {
  /** Field values: typed emails and passwords. */
  input: { fontSize: 17 },
  /** Error slips and validation messages. */
  message: { fontSize: 15, lineHeight: 21 },
  /** Password rules, field hints, "show"/"hide". */
  helper: { fontSize: 13, lineHeight: 18 },
  /** Privacy and security notes under a form. */
  fine: { fontSize: 13, lineHeight: 19 },
  /** Count lines like "3 things waiting". */
  count: { fontSize: 15, lineHeight: 21 },
  /** Journey list item titles. */
  item: { fontSize: 16, lineHeight: 22 },
  /** Place names and other secondary scan lines. */
  meta: { fontSize: 14, lineHeight: 19 },
} as const;
