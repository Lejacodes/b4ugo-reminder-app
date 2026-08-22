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

  // Little Guy — warm cream fluff with soft ink linework, per the character sheet
  guyBody: '#FDFBF4',
  guyBodyDark: '#3A342C',
  guyShade: '#F0E7D6',
  guyShadeDark: '#463E33',
  guyOutline: '#A08B74',
  guyOutlineDark: '#8B7A65',
  guyFeature: '#4A3B30',
  guyFeatureDark: '#EDE6D6',
  guyBlush: '#F2BFAF',
  guyBlushDark: '#A9705F',
  guyStar: '#F7D66F',
  guyStarOutline: '#D8B04A',
  guyWand: '#C6A57B',
  guyRibbon: '#C7B6E4',
} as const;

export type PaletteColor = keyof typeof palette;

export type MemoryParticleColor =
  | 'reminder'
  | 'buy'
  | 'trip'
  | 'task'
  | 'memory';

/**
 * Constellation dot colors, one hue per kind of memory Little Guy is holding.
 * Kept in sync with PIXEL_COLORS in lib/ai/constellation.ts.
 */
export const memoryParticleColors: Record<MemoryParticleColor, string> = {
  reminder: '#7BA3C9',
  buy: '#E4C36A',
  trip: '#E08A86',
  task: '#8FBF8A',
  memory: '#A48BC4',
};

/** Dark-mode constellation dots — same hues, lifted slightly to stay readable. */
export const memoryParticleColorsDark: Record<MemoryParticleColor, string> = {
  reminder: '#8FB6DA',
  buy: '#EBD07E',
  trip: '#EC9E9A',
  task: '#A2CF9C',
  memory: '#B69ED6',
};
