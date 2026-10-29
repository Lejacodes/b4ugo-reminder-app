import { signOutWithCleanup } from '@/lib/auth/sign-out-cleanup';

describe('signOutWithCleanup', () => {
  it('removes the outgoing push registration and geofences before invalidating auth', async () => {
    const events: string[] = [];
    const result = await signOutWithCleanup(
      async () => {
        events.push('invalidate');
      },
      {
        removePushToken: async () => {
          events.push('push:start');
          await Promise.resolve();
          events.push('push:end');
        },
        clearGeofences: async () => {
          events.push('geo:start');
          await Promise.resolve();
          events.push('geo:end');
        },
      },
    );

    expect(events.at(-1)).toBe('invalidate');
    expect(events.indexOf('push:end')).toBeLessThan(events.indexOf('invalidate'));
    expect(events.indexOf('geo:end')).toBeLessThan(events.indexOf('invalidate'));
    expect(result.cleanupFailures).toEqual([]);
  });

  it('still invalidates the session when cleanup fails', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const invalidateSession = jest.fn().mockResolvedValue(undefined);
    const result = await signOutWithCleanup(invalidateSession, {
      removePushToken: jest.fn().mockRejectedValue(new Error('offline')),
      clearGeofences: jest.fn().mockRejectedValue(new Error('native failure')),
    });

    expect(invalidateSession).toHaveBeenCalledTimes(1);
    expect(result.cleanupFailures).toEqual(['push-token', 'geofences']);
    expect(warning).toHaveBeenCalledTimes(2);
    warning.mockRestore();
  });

  it('cleans the correct outgoing user across account switches', async () => {
    let currentUser: string | null = 'user-a';
    const removedFor: string[] = [];
    const removePushToken = async () => {
      if (currentUser) removedFor.push(currentUser);
    };
    const clearGeofences = jest.fn().mockResolvedValue(undefined);

    await signOutWithCleanup(async () => {
      currentUser = null;
    }, { removePushToken, clearGeofences });
    currentUser = 'user-b';
    await signOutWithCleanup(async () => {
      currentUser = null;
    }, { removePushToken, clearGeofences });

    expect(removedFor).toEqual(['user-a', 'user-b']);
    expect(clearGeofences).toHaveBeenCalledTimes(2);
  });
});
