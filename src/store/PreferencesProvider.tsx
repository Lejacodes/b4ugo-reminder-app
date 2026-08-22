import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ensureMigrated } from '@/lib/api/migration';
import { profileRepository } from '@/lib/api/profile-repository';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/store/AuthProvider';
import {
  defaultUserPreferences,
  defaultUserProfile,
  type UserPreferences,
  type UserProfile,
} from '@/types';

type PreferencesContextValue = {
  profile: UserProfile;
  preferences: UserPreferences;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetAll: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Profile and preferences for whoever is currently signed in.
 *
 * Reads and writes are namespaced by the auth provider's user id, so the store
 * empties on sign-out and refills for the next account. Must be rendered
 * inside `AuthProvider`.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile());
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (status === 'restoring') {
        setIsLoading(true);
        return;
      }

      if (!userId) {
        setProfile(defaultUserProfile());
        setPreferences(defaultUserPreferences());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [storedProfile, storedPreferences] = await Promise.all([
          preferencesStorage.getItem(scopedKey(STORAGE_KEYS.profile, userId)),
          preferencesStorage.getItem(scopedKey(STORAGE_KEYS.preferences, userId)),
        ]);

        if (cancelled) return;

        let nextProfile = storedProfile
          ? { ...defaultUserProfile(userId), ...(JSON.parse(storedProfile) as UserProfile) }
          : defaultUserProfile(userId);
        let nextPreferences = storedPreferences
          ? { ...defaultUserPreferences(), ...(JSON.parse(storedPreferences) as UserPreferences) }
          : defaultUserPreferences();

        if (isSupabaseConfigured()) {
          await ensureMigrated(userId, user?.email);
          const [remoteProfile, remotePreferences] = await Promise.all([
            profileRepository.getProfile(),
            profileRepository.getPreferences(),
          ]);
          if (remoteProfile) nextProfile = { ...nextProfile, ...remoteProfile, userId };
          if (remotePreferences) nextPreferences = { ...nextPreferences, ...remotePreferences };
        }

        if (cancelled) return;
        setProfile(nextProfile);
        setPreferences(nextPreferences);
        await Promise.all([
          preferencesStorage.setItem(scopedKey(STORAGE_KEYS.profile, userId), JSON.stringify(nextProfile)),
          preferencesStorage.setItem(
            scopedKey(STORAGE_KEYS.preferences, userId),
            JSON.stringify(nextPreferences),
          ),
        ]);
      } catch {
        if (cancelled) return;
        // Unreadable local data is treated as a fresh profile; the account
        // itself is unaffected and the backend copy will win once it exists.
        setProfile(defaultUserProfile(userId));
        setPreferences(defaultUserPreferences());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId, user?.email]);

  const persistProfile = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      if (!userId) return;
      await preferencesStorage.setItem(
        scopedKey(STORAGE_KEYS.profile, userId),
        JSON.stringify(next),
      );
      if (isSupabaseConfigured()) {
        try {
          await profileRepository.upsertProfile(next);
        } catch {
          // Keep the local cache if the remote write fails.
        }
      }
    },
    [userId],
  );

  const persistPreferences = useCallback(
    async (next: UserPreferences) => {
      setPreferences(next);
      if (!userId) return;
      await preferencesStorage.setItem(
        scopedKey(STORAGE_KEYS.preferences, userId),
        JSON.stringify(next),
      );
      if (isSupabaseConfigured()) {
        try {
          await profileRepository.upsertPreferences(next);
        } catch {
          // Keep the local cache if the remote write fails.
        }
      }
    },
    [userId],
  );

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const next: UserProfile = {
        ...profile,
        ...patch,
        userId,
        updatedAt: new Date().toISOString(),
      };
      await persistProfile(next);
    },
    [profile, userId, persistProfile],
  );

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const next: UserPreferences = { ...preferences, ...patch };
      await persistPreferences(next);
    },
    [preferences, persistPreferences],
  );

  const completeOnboarding = useCallback(async () => {
    await updatePreferences({ hasCompletedOnboarding: true });
  }, [updatePreferences]);

  const resetAll = useCallback(async () => {
    if (userId) {
      await Promise.all([
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.profile, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.preferences, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.reminders, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.necessities, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.context, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.trips, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.packingItems, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.packingTemplates, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.travelIntentions, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.savedPlaces, userId)),
        preferencesStorage.removeItem(scopedKey(STORAGE_KEYS.notificationLog, userId)),
      ]);
    }
    setProfile(defaultUserProfile(userId));
    setPreferences(defaultUserPreferences());
  }, [userId]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      profile,
      preferences,
      isLoading,
      hasCompletedOnboarding: preferences.hasCompletedOnboarding,
      updateProfile,
      updatePreferences,
      completeOnboarding,
      resetAll,
    }),
    [
      profile,
      preferences,
      isLoading,
      updateProfile,
      updatePreferences,
      completeOnboarding,
      resetAll,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
