/**
 * Little Guy's geometry, drawn from the character sheet.
 *
 * Everything lives in a single 100 x 118 artboard so the SVG layers, the eye
 * dots and the constellation slots can all be expressed in the same
 * coordinates and scaled together by one factor.
 */

export const ARTBOARD = { width: 100, height: 118 } as const;

/** Body ellipse the fluff is built around, used to place the face and dots. */
export const BODY = { cx: 50, cy: 55, rx: 31, ry: 26 } as const;

/**
 * Fluff silhouette: outward arcs around the body ellipse with a little jitter
 * in the radius so the outline stays hand-drawn rather than geometric.
 */
export const BODY_PATH =
  'M50.0 28.6 A9.3 9.3 0 0 1 64.0 32.6 A8.9 8.9 0 0 1 75.7 40.1 A8.7 8.7 0 0 1 82.9 51.7 ' +
  'A8.4 8.4 0 0 1 79.7 64.4 A8.7 8.7 0 0 1 70.6 74.5 A9.4 9.4 0 0 1 57.8 81.6 ' +
  'A10.0 10.0 0 0 1 42.1 81.7 A9.1 9.1 0 0 1 30.7 73.3 A9.2 9.2 0 0 1 19.0 64.9 ' +
  'A8.3 8.3 0 0 1 20.5 52.0 A7.8 7.8 0 0 1 25.6 40.9 A8.8 8.8 0 0 1 34.6 30.4 ' +
  'A9.9 9.9 0 0 1 50.0 28.6 Z';

/** Two curled stalks. Mirrored, but not exactly, so they read as drawn by hand. */
export const ANTENNA_LEFT_PATH =
  'M45 32 C42 24 37 18.4 38.5 12.8 C39.6 8.6 45.2 7.8 46.6 11.6 C47.6 14.4 44.4 16.2 42.6 13.8';
export const ANTENNA_RIGHT_PATH =
  'M56 32 C59 23.6 64.2 18.2 62.6 12.6 C61.5 8.4 55.9 7.8 54.6 11.8 C53.7 14.6 57 16.2 58.7 13.6';

/**
 * Feet and arms are drawn behind the fluff so only the part that pokes out
 * shows. The fluff dips to roughly y = 85.5 at the centre, so the feet sit
 * lower than that to stay visible.
 */
export const FEET = [
  { cx: 44, cy: 85.5, rx: 4.6, ry: 4 },
  { cx: 56, cy: 85.5, rx: 4.6, ry: 4 },
] as const;

export const ARMS = [
  { cx: 23, cy: 68.5, rx: 4.4, ry: 3.6 },
  { cx: 78, cy: 67, rx: 4.4, ry: 3.6 },
] as const;

export const EYES = [
  { cx: 42.5, cy: 57 },
  { cx: 57.5, cy: 57 },
] as const;

export const EYE_RADIUS = { rx: 2.9, ry: 3.6 } as const;

export const BLUSH = [
  { cx: 32.6, cy: 62.4, rx: 5.6, ry: 3.5 },
  { cx: 67.4, cy: 62.4, rx: 5.6, ry: 3.5 },
] as const;

/** Closed / curved eye shapes, used where a dot would lose the expression. */
export const EYE_ARC_UP = ['M38.6 58 q3.9 -4.4 7.8 0', 'M53.6 58 q3.9 -4.4 7.8 0'] as const;
export const EYE_ARC_DOWN = ['M38.8 56.4 q3.7 4.2 7.4 0', 'M53.8 56.4 q3.7 4.2 7.4 0'] as const;

export const MOUTHS = {
  neutral: 'M47.4 63.6 q2.6 2.6 5.2 0',
  smile: 'M45.6 63.2 q4.4 4.6 8.8 0',
  wavy: 'M46.8 64.4 q1.6 -1.8 3.2 0 q1.6 1.8 3.2 0',
  tiny: 'M47.8 64.4 q2.2 1.4 4.4 0',
  open: 'M47.2 63.2 q2.8 4.8 5.6 0 z',
  round: 'M47.9 64.4 a2.1 2.1 0 1 1 4.2 0 a2.1 2.1 0 1 1 -4.2 0 z',
} as const;

/**
 * Star wand, held in his left hand so the stick runs just outside the fluff
 * and the star floats up beside his head rather than across his face.
 */
export const WAND_STICK = 'M24.5 71 L12.5 36';
export const WAND_STAR =
  'M9.8 19.0 L12.8 24.1 L18.7 23.7 L14.8 28.2 L17.0 33.7 L11.5 31.4 L7.0 35.1 ' +
  'L7.5 29.2 L2.5 26.0 L8.3 24.7 Z';
export const WAND_RIBBON = [
  { cx: 14.6, cy: 48.6, rx: 2.7, ry: 1.9, rotate: -24 },
  { cx: 19.2, cy: 47.4, rx: 2.7, ry: 1.9, rotate: 18 },
] as const;
/** Point the wand pivots around when it sways. */
export const WAND_ORIGIN = { x: 24.5, y: 71 } as const;

/** Four-point sparkle centred on the origin; positioned by translating it. */
export const SPARKLE_PATH =
  'M0.0 -4.0 L0.7 -1.0 L3.8 -1.2 L1.1 0.4 L2.4 3.2 L0.0 1.2 L-2.4 3.2 L-1.1 0.4 L-3.8 -1.2 L-0.7 -1.0 Z';

export const SPARKLES = [
  { x: 22, y: 14.5, scale: 0.6, delay: 0 },
  { x: 3, y: 15, scale: 0.42, delay: 900 },
  { x: 19, y: 36.5, scale: 0.34, delay: 1800 },
] as const;

/**
 * Where constellation dots orbit. Centres, in artboard coordinates, arranged
 * around the fluff and clear of the wand so nothing sits on top of him.
 */
export const CONSTELLATION_SLOTS = [
  { x: 88, y: 36 },
  { x: 94, y: 61 },
  { x: 86, y: 85 },
  { x: 67, y: 99 },
  { x: 41, y: 102 },
  { x: 18, y: 94 },
  { x: 5, y: 77 },
  { x: 74, y: 13 },
] as const;
