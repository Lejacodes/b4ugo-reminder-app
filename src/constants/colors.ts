/**
 * B4UGO raw color palette.
 * Components should consume semantic tokens from theme.ts, not these directly.
 *
 * Core brand (source of truth):
 * Matcha #76845B, Oat #D8D3B3, Espresso #603314, Cloud #B1B7BE
 */

export const palette = {
  // Core brand
  cream: '#F5F1E7',
  oat: '#D8D3B3',
  deepForest: '#465442',
  softMatcha: '#76845B',
  sage: '#9DB496',
  espresso: '#603314',
  cloud: '#B1B7BE',

  /** Readable warm grays for text hierarchy (not brand accent colors). */
  warmGraySecondary: '#7A6F65',
  warmGrayMuted: '#8F8278',
  warmGrayDisabled: '#B1B7BE',

  // Accent colors — use intentionally, not everywhere
  mutedCoral: '#D9826B',
  dustyRose: '#C98F9A',
  softAqua: '#90C5BC',

  // Dark mode bases — warm, not pure black
  darkBackground: '#1A1814',
  darkBackgroundElevated: '#242019',
  darkSurface: '#2E261F',
  darkSurfaceElevated: '#3A3028',
  darkEspresso: '#4A3828',
  darkBorder: '#3D3530',

  // Text on dark
  creamText: '#F5F1E7',
  cloudDark: '#9BA3AB',
  warmGraySecondaryDark: '#C4BCB3',
  warmGrayMutedDark: '#A89F96',
  warmGrayDisabledDark: '#6A6258',

  // Little Guy placeholder — tuned to sit on cream/oat backgrounds
  guyBody: '#E8E0D0',
  guyBodyDark: '#3A342C',
  guyFeature: '#465442',
  guyFeatureDark: '#D8D3B3',
} as const;

export type PaletteColor = keyof typeof palette;

export type MemoryParticleColor =
  | 'reminder'
  | 'buy'
  | 'trip'
  | 'task'
  | 'memory';

/** Memory particles map to intentional accent colors. */
export const memoryParticleColors: Record<MemoryParticleColor, string> = {
  reminder: palette.softAqua,
  buy: palette.mutedCoral,
  trip: palette.dustyRose,
  task: palette.sage,
  memory: palette.softMatcha,
};

/** Light-mode memory particles (same mapping; kept for clarity). */
export const memoryParticleColorsDark: Record<MemoryParticleColor, string> = {
  reminder: palette.softAqua,
  buy: palette.mutedCoral,
  trip: palette.dustyRose,
  task: palette.sage,
  memory: palette.softMatcha,
};
