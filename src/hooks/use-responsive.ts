import { useWindowDimensions } from 'react-native';

import { maxContentWidth, spacing } from '@/constants/spacing';

/**
 * Responsive layout helpers for phone, large phone, and web.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isCompact = width < 375;
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - spacing.lg * 2, maxContentWidth);

  return {
    width,
    isCompact,
    isTablet,
    contentWidth,
    maxContentWidth,
    horizontalPadding: isTablet ? spacing.xl : spacing.lg,
  };
}
