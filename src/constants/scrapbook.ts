/**
 * Tokens for the scrapbook screens — account creation, log in, home, and trips.
 *
 * Opening and scrapbook share the same oat desk, cream paper, and matcha marks
 * so the first window and the signed-in app feel like one place.
 */
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
  deskDot: 'rgba(118, 132, 91, 0.22)',
  paper: palette.cream,
  paperWarm: palette.oat,
  paperBacking: palette.softMatcha,
  ink: palette.espresso,
  inkSoft: palette.warmGraySecondary,
  line: 'rgba(177, 183, 190, 0.7)',
  marginLine: 'rgba(118, 132, 91, 0.28)',
  butter: palette.softMatcha,
  butterDeep: palette.deepForest,
  tape: palette.softMatcha,
  clip: palette.softMatcha,
  doodle: palette.softMatcha,
  shadow: 'rgba(96, 51, 20, 0.16)',
  blush: palette.oat,
  blushDeep: palette.cloud,
  stickyButter: palette.softMatcha,
  stickyBlush: palette.oat,
  stickyCream: palette.cream,
  stickyEdge: palette.cloud,
  slipInk: palette.espresso,
  slip: palette.oat,
  inkOnMatcha: palette.cream,
};

/**
 * Dark scrapbook: deep espresso desk, lighter paper, oat text, matcha accent.
 */
export const scrapbookPaletteDark: ScrapbookPalette = {
  desk: palette.darkSurface,
  deskDot: 'rgba(118, 132, 91, 0.2)',
  paper: palette.darkEspresso,
  paperWarm: palette.darkSurfaceElevated,
  paperBacking: palette.deepForest,
  ink: palette.oat,
  inkSoft: palette.cloud,
  line: 'rgba(216, 211, 179, 0.28)',
  marginLine: 'rgba(118, 132, 91, 0.35)',
  butter: palette.softMatcha,
  butterDeep: palette.sage,
  tape: palette.softMatcha,
  clip: palette.softMatcha,
  doodle: palette.sage,
  shadow: 'rgba(26, 24, 20, 0.45)',
  blush: palette.darkEspresso,
  blushDeep: palette.cloudDark,
  stickyButter: palette.softMatcha,
  stickyBlush: palette.darkSurfaceElevated,
  stickyCream: palette.darkSurfaceElevated,
  stickyEdge: palette.cloudDark,
  slipInk: palette.oat,
  slip: palette.darkSurface,
  inkOnMatcha: palette.cream,
};

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
