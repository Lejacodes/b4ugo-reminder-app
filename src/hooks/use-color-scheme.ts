import { useResolvedScheme } from '@/store/AppearanceProvider';

/**
 * App appearance. Uses the persisted Profile choice when the provider is
 * mounted; otherwise light. Not a second theme system — `useTheme()` reads this.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useResolvedScheme();
}
