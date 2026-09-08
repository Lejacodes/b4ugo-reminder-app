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
    background: palette.oat,
    backgroundSecondary: palette.cream,

    surface: palette.cream,
    surfaceElevated: palette.cream,
    surfaceMuted: palette.oat,

    primary: palette.softMatcha,
    primaryMuted: palette.sage,
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

    border: palette.cloud,
    borderSubtle: palette.oat,

    tabBar: palette.cream,
    tabBarBorder: palette.cloud,
    tabBarActive: palette.softMatcha,
    tabBarInactive: palette.warmGraySecondary,
    tabBarAdd: palette.softMatcha,

    pressedOverlay: 'rgba(44, 34, 30, 0.08)',
    disabled: palette.warmGrayDisabled,
  },
  dark: {
    background: palette.darkSurface,
    backgroundSecondary: palette.darkBackgroundElevated,

    surface: palette.darkEspresso,
    surfaceElevated: palette.darkSurfaceElevated,
    surfaceMuted: palette.darkBackgroundElevated,

    primary: palette.darkAccent,
    primaryMuted: palette.darkAccent,
    secondary: palette.darkAccent,
    secondarySoft: palette.darkAccent,

    text: palette.creamText,
    textSecondary: palette.cloudDark,
    textMuted: palette.warmGrayMutedDark,
    textDisabled: palette.warmGrayDisabledDark,
    textOnPrimary: palette.darkBackground,
    textOnSurface: palette.creamText,

    accentWarm: palette.mutedCoral,
    accentRose: palette.dustyRose,
    accentAqua: palette.softAqua,

    border: palette.darkBorder,
    borderSubtle: palette.darkBorder,

    tabBar: palette.darkBackground,
    tabBarBorder: palette.darkBorder,
    tabBarActive: palette.darkAccent,
    tabBarInactive: palette.cloudDark,
    tabBarAdd: palette.darkAccent,

    pressedOverlay: 'rgba(236, 234, 228, 0.08)',
    disabled: palette.warmGrayDisabledDark,
  },
} as const satisfies Record<'light' | 'dark', ThemeColors>;

export type ThemeColor = keyof ThemeColors;
export type ColorScheme = keyof typeof Colors;

export { spacing, tabBarContentHeight } from './spacing';
