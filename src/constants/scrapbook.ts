/**
 * Tokens for the scrapbook screens — account creation, log in, home, and trips.
 *
 * Opening and scrapbook share the same oat desk, cream paper, and matcha marks
 * so the first window and the signed-in app feel like one place.
 */
import { type TextStyle } from 'react-native';

import { palette } from './colors';
import { openingPalette, STARRY_NIGHT_FONT } from './opening';
import { fontFamily } from './typography';

export { openingPalette, STARRY_NIGHT_FONT };

export type ScrapbookPalette = {
  desk: string;
  deskDot: string;
  paper: string;
  paperWarm: string;
  paperBacking: string;
  ink: string;
  inkSoft: string;
  line: string;
  marginLine: string;
  butter: string;
  butterDeep: string;
  tape: string;
  clip: string;
  doodle: string;
  shadow: string;
  blush: string;
  blushDeep: string;
  stickyButter: string;
  stickyBlush: string;
  stickyCream: string;
  stickyEdge: string;
  slipInk: string;
  slip: string;
  /** Body/subtitle text on matcha or other dark green surfaces. */
  inkOnMatcha: string;
};

/** True when a surface uses the dark matcha/green card fill. */
export function isMatchaSurface(color: string, palette: ScrapbookPalette): boolean {
  return (
    color === palette.stickyButter ||
    color === palette.butter ||
    color === palette.paperBacking ||
    color === palette.tape ||
    color === palette.clip
  );
}

export const scrapbookPalette: ScrapbookPalette = {
  desk: palette.oat,
  deskDot: 'rgba(107, 142, 106, 0.22)',
  paper: palette.cream,
  paperWarm: palette.cream,
  paperBacking: palette.softMatcha,
  ink: palette.espresso,
  inkSoft: palette.warmGraySecondary,
  line: palette.cloud,
  marginLine: 'rgba(107, 142, 106, 0.28)',
  butter: palette.softMatcha,
  butterDeep: palette.deepForest,
  tape: palette.softMatcha,
  clip: palette.softMatcha,
  doodle: palette.softMatcha,
  shadow: 'rgba(44, 34, 30, 0.14)',
  blush: palette.oat,
  blushDeep: palette.cloud,
  // Sage keeps espresso body text above WCAG AA contrast for normal text.
  stickyButter: palette.sage,
  stickyBlush: palette.oat,
  stickyCream: palette.cream,
  stickyEdge: palette.cloud,
  slipInk: palette.espresso,
  slip: palette.oat,
  inkOnMatcha: palette.cream,
};

/**
 * Dark scrapbook: deep slate-matcha desk, cream ink, lifted matcha tape.
 */
export const scrapbookPaletteDark: ScrapbookPalette = {
  desk: '#121614',
  deskDot: 'rgba(142, 168, 140, 0.22)',
  paper: '#1B211E',
  paperWarm: '#1B211E',
  paperBacking: '#8EA88C',
  ink: '#ECEAE4',
  inkSoft: '#9DA8A1',
  line: '#28322D',
  marginLine: 'rgba(142, 168, 140, 0.35)',
  butter: '#8EA88C',
  butterDeep: '#8EA88C',
  tape: '#8EA88C',
  clip: '#8EA88C',
  doodle: '#8EA88C',
  shadow: 'rgba(0, 0, 0, 0.45)',
  blush: '#1B211E',
  blushDeep: '#9DA8A1',
  stickyButter: '#8EA88C',
  stickyBlush: '#1B211E',
  stickyCream: '#1B211E',
  stickyEdge: '#28322D',
  slipInk: '#ECEAE4',
  slip: '#121614',
  inkOnMatcha: '#121614',
};

/** Sticky notes cycle through these so a grid never looks uniform. */
export const stickyColors = [
  scrapbookPalette.stickyButter,
  scrapbookPalette.stickyBlush,
  scrapbookPalette.stickyCream,
] as const;

/**
 * Small rotations applied round-robin. Cards stay between 1° and 2° so
 * body text stays horizontal enough to scan.
 */
export const paperTilts = ['-1.4deg', '1.1deg', '-1.7deg', '1.8deg', '-2deg', '1.2deg'] as const;

export function tiltAt(index: number): string {
  return paperTilts[index % paperTilts.length];
}

/**
 * Two typefaces, and the split between them is deliberate.
 *
 * Fraunces is only for: the B4UGO wordmark, top-level screen titles,
 * and Little Guy dialogue (whispers and chat lines). It is never used for
 * body copy, section titles, lists, fields, badges, or buttons.
 *
 * The system sans takes everything a person has to read exactly — checklist
 * items, inputs, labels, dates, places, toggles, and buttons.
 */
export const DISPLAY_FONT = STARRY_NIGHT_FONT;
export const TEXT_FONT = fontFamily.sans;

/**
 * System sans for anything a person must read. Always sets `fontFamily` so
 * checklist rows cannot inherit Fraunces from a parent or from `useFonts`.
 */
export const readableFont: TextStyle = { fontFamily: TEXT_FONT };

/** Fraunces sizes. Decorative text only. */
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
