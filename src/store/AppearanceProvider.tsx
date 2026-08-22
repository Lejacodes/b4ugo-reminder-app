import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { usePreferences } from '@/store/PreferencesProvider';
import type { AppearancePreference } from '@/types/preferences';

type AppearanceContextValue = {
  scheme: AppearancePreference;
  setAppearance: (next: AppearancePreference) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/**
 * Resolves the user's persisted light/dark choice for the rest of the app.
 * Must sit inside PreferencesProvider. Light first; dark only when saved.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = usePreferences();
  const scheme: AppearancePreference = preferences.appearance === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.dataset.theme = scheme;
    document.documentElement.style.colorScheme = scheme;
  }, [scheme]);

  const setAppearance = useCallback(
    async (next: AppearancePreference) => {
      await updatePreferences({ appearance: next });
    },
    [updatePreferences],
  );

  const value = useMemo(
    () => ({ scheme, setAppearance }),
    [scheme, setAppearance],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return ctx;
}

/** Safe for hooks that may run outside the provider (defaults to light). */
export function useResolvedScheme(): AppearancePreference {
  const ctx = useContext(AppearanceContext);
  return ctx?.scheme ?? 'light';
}
