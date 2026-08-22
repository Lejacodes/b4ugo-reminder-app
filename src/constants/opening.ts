/**
 * Tokens for the opening / login window only.
 * Warm cream paper, butter-yellow marks, espresso ink.
 * Illustrated stationery — not a dashboard palette.
 */
import { cubicBezier } from 'react-native-reanimated';

export const openingPalette = {
  desk: '#EDE4D0',
  deskDot: 'rgba(232, 201, 106, 0.18)',
  paper: '#F7F3E8',
  paperWarm: '#EFE6D4',
  paperBacking: '#EAD6D0',
  ink: '#5C3A28',
  inkSoft: '#7A5A48',
  line: 'rgba(92, 58, 40, 0.14)',
  marginLine: 'rgba(201, 143, 154, 0.35)',
  butter: '#E8C96A',
  butterDeep: '#D4B24A',
  tape: '#EED48A',
  clip: '#E8C96A',
  doodle: '#3F4A62',
  shadow: 'rgba(92, 58, 40, 0.16)',
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
