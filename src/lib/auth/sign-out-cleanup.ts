import { pushTokenRepository } from '@/lib/api/push-token-repository';
import { clearGeofenceRegistrations } from '@/lib/location/geofence-sync';

export type SignOutCleanupStep = 'push-token' | 'geofences';

type SignOutDependencies = {
  removePushToken: () => Promise<void>;
  clearGeofences: () => Promise<void>;
  invalidateSession: () => Promise<void>;
};

export type SignOutResult = {
  cleanupFailures: SignOutCleanupStep[];
};

const defaultCleanup = {
  removePushToken: () => pushTokenRepository.removeAllForCurrentUser(),
  clearGeofences: () => clearGeofenceRegistrations(),
};

/**
 * Cleans user-scoped device/server registrations while authentication still
 * identifies the outgoing user, then invalidates the session. Cleanup is
 * best-effort so a native/API failure can never trap someone in the account.
 */
export async function signOutWithCleanup(
  invalidateSession: () => Promise<void>,
  overrides: Partial<Omit<SignOutDependencies, 'invalidateSession'>> = {},
): Promise<SignOutResult> {
  const dependencies: SignOutDependencies = {
    ...defaultCleanup,
    ...overrides,
    invalidateSession,
  };

  const settled = await Promise.allSettled([
    dependencies.removePushToken(),
    dependencies.clearGeofences(),
  ]);
  const cleanupFailures: SignOutCleanupStep[] = [];
  if (settled[0].status === 'rejected') cleanupFailures.push('push-token');
  if (settled[1].status === 'rejected') cleanupFailures.push('geofences');

  for (const failure of cleanupFailures) {
    console.warn(`[blugo] ${failure} cleanup failed during sign out`);
  }

  await dependencies.invalidateSession();
  return { cleanupFailures };
}
