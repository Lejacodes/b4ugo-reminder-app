import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import {
  hasEnteredOpeningSession,
  subscribeOpeningSession,
} from '@/lib/opening-session';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';

/**
 * Decides which of the four route groups the user belongs in.
 *
 *   fresh launch              → /opening   (paper animation, every launch)
 *   signed out, been here     → /auth      (log in / create account)
 *   signed in, setup pending  → /onboarding
 *   signed in, setup done     → /(tabs)
 *
 * Authentication comes before anything personal is asked for, so a name or a
 * preference is only ever collected once there is an account to attach it to.
 * A stored session does not skip the opening animation; it only decides where
 * to go after the paper has finished unfolding.
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

    if (!enteredOpening) {
      if (!inOpening) router.replace('/opening');
      return;
    }

    // Hold still until we know who the user is and what they've already done.
    if (status === 'restoring' || isLoading) return;

    if (status === 'signed-out') {
      // The opening window has already played this launch — after a sign-out
      // or an expired session, go straight back to the log in sheet.
      if (!inAuth && !inOpening) router.replace('/auth/sign-in');
      return;
    }

    if (!hasCompletedOnboarding) {
      if (!inOnboarding) router.replace('/onboarding/name');
      return;
    }

    if (inOnboarding || inAuth || inOpening) {
      router.replace('/(tabs)');
    }
  }, [
    status,
    enteredOpening,
    hasCompletedOnboarding,
    isLoading,
    segments,
    router,
  ]);
}
