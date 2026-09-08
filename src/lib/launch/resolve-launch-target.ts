import type { AuthStatus } from '@/store/AuthProvider';

export type LaunchTarget = 'hold' | 'opening' | 'auth' | 'onboarding' | 'tabs';

/**
 * Where a cold start should land. Returning signed-in sessions skip /opening.
 * The paper unfold is for first run, login, and re-authentication only.
 */
export function resolveLaunchTarget(input: {
  status: AuthStatus;
  prefsLoading: boolean;
  hasCompletedOnboarding: boolean;
  enteredOpening: boolean;
}): LaunchTarget {
  if (input.status === 'restoring' || input.prefsLoading) return 'hold';

  if (input.status === 'signed-in') {
    return input.hasCompletedOnboarding ? 'tabs' : 'onboarding';
  }

  if (!input.enteredOpening) return 'opening';
  return 'auth';
}
