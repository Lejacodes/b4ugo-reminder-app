import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { resolveLaunchTarget } from '@/lib/launch/resolve-launch-target';
import {
  hasEnteredOpeningSession,
  markOpeningEntered,
  subscribeOpeningSession,
} from '@/lib/opening-session';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';

/**
 * Decides which of the four route groups the user belongs in.
 *
 *   signed in, setup done     → /(tabs)   (skips /opening on cold start)
 *   signed in, setup pending  → /onboarding
 *   signed out, first run     → /opening  (paper unfold)
 *   signed out, already seen  → /auth
 */
export function useSessionGuard() {
  const { status } = useAuth();
  const { hasCompletedOnboarding, isLoading } = usePreferences();
  const segments = useSegments();
  const router = useRouter();
  const [enteredOpening, setEnteredOpening] = useState(hasEnteredOpeningSession);

  useEffect(() => subscribeOpeningSession(() => setEnteredOpening(hasEnteredOpeningSession())), []);

  useEffect(() => {
    const root = segments[0] as string | undefined;
    const inOpening = root === 'opening';
    const inAuth = root === 'auth';
    const inOnboarding = root === 'onboarding';

    const target = resolveLaunchTarget({
      status,
      prefsLoading: isLoading,
      hasCompletedOnboarding,
      enteredOpening,
    });

    if (target === 'hold') return;

    if (target === 'tabs') {
      markOpeningEntered();
      if (inOpening || inAuth || inOnboarding) router.replace('/(tabs)');
      void SplashScreen.hideAsync();
      return;
    }

    if (target === 'onboarding') {
      markOpeningEntered();
      if (!inOnboarding) router.replace('/onboarding/name');
      void SplashScreen.hideAsync();
      return;
    }

    if (target === 'opening') {
      if (!inOpening) router.replace('/opening');
      void SplashScreen.hideAsync();
      return;
    }

    if (!inAuth && !inOpening) router.replace('/auth/sign-in');
    void SplashScreen.hideAsync();
  }, [
    status,
    enteredOpening,
    hasCompletedOnboarding,
    isLoading,
    segments,
    router,
  ]);
}
