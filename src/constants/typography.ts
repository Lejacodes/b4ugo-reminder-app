import { Platform } from 'react-native';

/**
 * Platform system fonts — SF Pro on iOS, Roboto on Android, Inter fallback on web.
 * Distinction comes from hierarchy (size/weight/spacing), not decorative typefaces.
 */
export const fontFamily = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  default: {
    sans: 'System',
    mono: 'monospace',
  },
});

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 22,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 32,
  display: 28,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export type TextVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'bodyMedium'
  | 'caption'
  | 'label'
  | 'button';

type VariantStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing?: number;
};

export const textVariants: Record<TextVariant, VariantStyle> = {
  display: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
};

/** Minimum touch target per WCAG / platform HIG. */
export const minTouchTarget = 44;
