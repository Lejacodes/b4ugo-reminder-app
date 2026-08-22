import { scrapbookPalette, scrapbookPaletteDark } from '@/constants/scrapbook';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Light or dark stationery tokens from the existing matcha-earth palette. */
export function useScrapbookPalette() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? scrapbookPaletteDark : scrapbookPalette;
}

/** Desk fill for screens that sit on the scrapbook background. */
export function useDeskStyle() {
  const palette = useScrapbookPalette();
  return { flex: 1 as const, backgroundColor: palette.desk };
}
