import { useResolvedScheme } from '@/store/AppearanceProvider';

export function useColorScheme(): 'light' | 'dark' {
  return useResolvedScheme();
}
