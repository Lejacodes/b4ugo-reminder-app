/**
 * Tokens for the opening / login window.
 * Same oat desk, cream paper, and matcha marks as the rest of the light-mode app.
 */
import { cubicBezier } from 'react-native-reanimated';

import { palette } from './colors';

export const openingPalette = {
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
} as const;

export const STARRY_NIGHT_FONT = 'StarryNight';

/** Independent stages so each beat can be driven on its own. */
export type OpeningStage = 'logo' | 'ball' | 'unfold' | 'settle' | 'login';

export const openingTiming = {
  logoMs: 0,
  ballMs: 420,
  unfoldMs: 980,
  settleMs: 2680,
  loginMs: 3380,
  unfoldDurationMs: 1700,
  settleDurationMs: 560,
  loginFadeMs: 700,
  logoFadeMs: 640,
} as const;

/** Reanimated CSS animation easing — not CSS strings. */
export const openingEase = cubicBezier(0.22, 1, 0.36, 1);
export const openingEaseSettle = cubicBezier(0.33, 1, 0.32, 1);
export const openingEaseExit = cubicBezier(0.4, 0, 1, 1);
