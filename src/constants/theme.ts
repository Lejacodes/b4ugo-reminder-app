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
    textOnPrimary: palette.oat,
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

    pressedOverlay: 'rgba(96, 51, 20, 0.08)',
    disabled: palette.warmGrayDisabled,
  },
  dark: {
    background: palette.darkSurface,
    backgroundSecondary: palette.darkBackgroundElevated,

    surface: palette.darkEspresso,
    surfaceElevated: palette.darkSurfaceElevated,
    surfaceMuted: palette.darkBackgroundElevated,

    primary: palette.softMatcha,
    primaryMuted: palette.sage,
    secondary: palette.softMatcha,
    secondarySoft: palette.sage,

    text: palette.oat,
    textSecondary: palette.cloud,
    textMuted: palette.cloudDark,
    textDisabled: palette.warmGrayDisabledDark,
    textOnPrimary: palette.oat,
    textOnSurface: palette.oat,

    accentWarm: palette.mutedCoral,
    accentRose: palette.dustyRose,
    accentAqua: palette.softAqua,

    border: palette.cloudDark,
    borderSubtle: palette.darkBorder,

    tabBar: palette.darkBackground,
    tabBarBorder: palette.darkBorder,
    tabBarActive: palette.softMatcha,
    tabBarInactive: palette.cloud,
    tabBarAdd: palette.softMatcha,

    pressedOverlay: 'rgba(216, 211, 179, 0.08)',
    disabled: palette.warmGrayDisabledDark,
  },
} as const satisfies Record<'light' | 'dark', ThemeColors>;

export type ThemeColor = keyof ThemeColors;
export type ColorScheme = keyof typeof Colors;

export { spacing, tabBarContentHeight } from './spacing';
