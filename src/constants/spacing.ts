/** Consistent spacing scale (4px base). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/** Icon/content area of the tab bar, excluding safe-area inset. */
export const tabBarContentHeight = 49;

/** @deprecated Use tabBarContentHeight + useTabBarInset() for dynamic sizing. */
export const tabBarHeight = 56;

/** Max content width on tablet/web so layouts don't stretch infinitely. */
export const maxContentWidth = 480;
