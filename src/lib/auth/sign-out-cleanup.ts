import { pushTokenRepository } from '@/lib/api/push-token-repository';
import { clearGeofenceRegistrations } from '@/lib/location/geofence-sync';
import { invalidatePushRegistration } from '@/lib/notifications/installation';
import { appNotificationService } from '@/lib/notifications/notification-service';

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
  removePushToken: () => pushTokenRepository.removeCurrentInstallation(),
  clearGeofences: async () => {
    await clearGeofenceRegistrations();
    const ids = await appNotificationService.listScheduledIds();
    await Promise.all(ids.map((id) => appNotificationService.cancel(id)));
  },
};

async function bounded(task: () => Promise<void>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([task(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Cleanup timed out')), 5000);
    })]);
  } finally { clearTimeout(timer); }
}

/**
 * Cleans user-scoped device/server registrations while authentication still
 * identifies the outgoing user, then invalidates the session. Cleanup is
 * best-effort so a native/API failure can never trap someone in the account.
 */
export async function signOutWithCleanup(
  invalidateSession: () => Promise<void>,
  overrides: Partial<Omit<SignOutDependencies, 'invalidateSession'>> = {},
): Promise<SignOutResult> {
  invalidatePushRegistration();
  const dependencies: SignOutDependencies = {
    ...defaultCleanup,
    ...overrides,
    invalidateSession,
  };

  const settled = await Promise.allSettled([
    bounded(dependencies.removePushToken),
    bounded(dependencies.clearGeofences),
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
