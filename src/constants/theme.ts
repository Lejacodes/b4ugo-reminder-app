import '@/global.css';

import { palette } from './colors';

/**
 * Semantic theme tokens consumed by components via useTheme().
 * Every UI color should reference one of these keys.
 */
export type ThemeColors = {
  // Backgrounds
  background: string;
  backgroundSecondary: string;

  // Surfaces
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;

  // Brand
  primary: string;
  primaryMuted: string;
  secondary: string;
  secondarySoft: string;

  // Text hierarchy — primary > secondary > muted > disabled
  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnPrimary: string;
  textOnSurface: string;

  // Accents — use sparingly
  accentWarm: string;
  accentRose: string;
  accentAqua: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarAdd: string;

  // Interactive states
  pressedOverlay: string;
  disabled: string;
};

export const Colors = {
  light: {
    background: palette.cream,
    backgroundSecondary: palette.oat,

    surface: palette.oat,
    surfaceElevated: palette.cream,
    surfaceMuted: '#E8E3D4',

    primary: palette.deepForest,
    primaryMuted: palette.softMatcha,
    secondary: palette.softMatcha,
    secondarySoft: palette.sage,

    text: palette.espresso,
    textSecondary: palette.warmGraySecondary,
    textMuted: palette.warmGrayMuted,
    textDisabled: palette.warmGrayDisabled,
    textOnPrimary: palette.cream,
    textOnSurface: palette.espresso,

    accentWarm: palette.mutedCoral,
    accentRose: palette.dustyRose,
    accentAqua: palette.softAqua,

    border: '#C8C2A8',
    borderSubtle: '#DDD8C4',

    tabBar: palette.cream,
    tabBarBorder: '#DDD8C4',
    tabBarActive: palette.deepForest,
    tabBarInactive: palette.warmGraySecondary,
    tabBarAdd: palette.deepForest,

    pressedOverlay: 'rgba(96, 51, 20, 0.08)',
    disabled: palette.warmGrayDisabled,
  },
  dark: {
    background: palette.darkBackground,
    backgroundSecondary: palette.darkBackgroundElevated,

    surface: palette.darkSurface,
    surfaceElevated: palette.darkSurfaceElevated,
    surfaceMuted: palette.darkEspresso,

    primary: palette.sage,
    primaryMuted: palette.softMatcha,
    secondary: palette.softMatcha,
    secondarySoft: palette.sage,

    text: palette.creamText,
    textSecondary: palette.warmGraySecondaryDark,
    textMuted: palette.warmGrayMutedDark,
    textDisabled: palette.warmGrayDisabledDark,
    textOnPrimary: palette.darkBackground,
    textOnSurface: palette.creamText,

    accentWarm: palette.mutedCoral,
    accentRose: palette.dustyRose,
    accentAqua: palette.softAqua,

    border: palette.darkBorder,
    borderSubtle: '#322C26',

    tabBar: palette.darkBackgroundElevated,
    tabBarBorder: palette.darkBorder,
    tabBarActive: palette.sage,
    tabBarInactive: palette.warmGraySecondaryDark,
    tabBarAdd: palette.sage,

    pressedOverlay: 'rgba(245, 241, 231, 0.08)',
    disabled: palette.warmGrayDisabledDark,
  },
} as const satisfies Record<'light' | 'dark', ThemeColors>;

export type ThemeColor = keyof ThemeColors;
export type ColorScheme = keyof typeof Colors;

export { spacing, tabBarContentHeight } from './spacing';
