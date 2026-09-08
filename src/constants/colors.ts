/**
 * B4UGO raw color palette.
 * Components should consume semantic tokens from theme.ts, not these directly.
 *
 * Light desk (source of truth):
 * Desk #F3EFEA, Card #FCFAF7, Border #E2DDD5, Ink #2C221E,
 * Muted #6E655F, Accent / tape #6B8E6A
 */

export const palette = {
  // Core brand — light desk
  cream: '#FCFAF7',
  oat: '#F3EFEA',
  deepForest: '#4F6B4E',
  softMatcha: '#6B8E6A',
  sage: '#8AA889',
  espresso: '#2C221E',
  cloud: '#E2DDD5',

  /** Readable warm grays for text hierarchy (not brand accent colors). */
  warmGraySecondary: '#6E655F',
  warmGrayMuted: '#8A817A',
  warmGrayDisabled: '#B7B1AA',

  // Accent colors — use intentionally, not everywhere
  mutedCoral: '#D9826B',
  dustyRose: '#C98F9A',
  softAqua: '#90C5BC',

  // Dark mode — deep slate-matcha
  darkBackground: '#121614',
  darkBackgroundElevated: '#1B211E',
  darkSurface: '#121614',
  darkSurfaceElevated: '#1B211E',
  darkEspresso: '#1B211E',
  darkBorder: '#28322D',
  darkAccent: '#8EA88C',

  // Text on dark
  creamText: '#ECEAE4',
  cloudDark: '#9DA8A1',
  warmGraySecondaryDark: '#9DA8A1',
  warmGrayMutedDark: '#7E8882',
  warmGrayDisabledDark: '#5C6560',

  // Little Guy — warm cream in every appearance. Never invert for dark mode.
  guyBody: '#FFFDF7',
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
  | 'urgent'
  | 'due'
  | 'errand'
  | 'nearby'
  | 'necessity'
  | 'general'
  | 'trip';

/**
 * Constellation spark colors, mapped from urgency.
 * Overdue → coral, due today / departure → amber, errands → sage/green,
 * persistent necessities → gold, future trip items → blue.
 */
export const memoryParticleColors: Record<MemoryParticleColor, string> = {
  urgent: '#E56B6F',
  due: '#F4A261',
  errand: '#6E8B6B',
  nearby: '#2A9D8F',
  necessity: '#E9C46A',
  general: '#D4A373',
  trip: '#457B9D',
};

/** Dark-mode constellation sparks — same hues, lifted slightly to stay readable. */
export const memoryParticleColorsDark: Record<MemoryParticleColor, string> = {
  urgent: '#F08A8D',
  due: '#F6B67A',
  errand: '#86A383',
  nearby: '#4BB5A8',
  necessity: '#F0D285',
  general: '#E0B78A',
  trip: '#5E94B5',
};
