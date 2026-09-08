import { resolveLaunchTarget } from '@/lib/launch/resolve-launch-target';

describe('resolveLaunchTarget', () => {
  it('holds while auth or preferences are still restoring', () => {
    expect(
      resolveLaunchTarget({
        status: 'restoring',
        prefsLoading: false,
        hasCompletedOnboarding: true,
        enteredOpening: false,
      }),
    ).toBe('hold');
    expect(
      resolveLaunchTarget({
        status: 'signed-in',
        prefsLoading: true,
        hasCompletedOnboarding: true,
        enteredOpening: false,
      }),
    ).toBe('hold');
  });

  it('still skips opening when a returning session already saw it this process', () => {
    expect(
      resolveLaunchTarget({
        status: 'signed-in',
        prefsLoading: false,
        hasCompletedOnboarding: true,
        enteredOpening: true,
      }),
    ).toBe('tabs');
  });

  it('keeps incomplete onboarding off the opening animation', () => {
    expect(
      resolveLaunchTarget({
        status: 'signed-in',
        prefsLoading: false,
        hasCompletedOnboarding: false,
        enteredOpening: false,
      }),
    ).toBe('onboarding');
  });

  it('reserves the paper unfold for signed-out first run and re-auth', () => {
    expect(
      resolveLaunchTarget({
        status: 'signed-out',
        prefsLoading: false,
        hasCompletedOnboarding: false,
        enteredOpening: false,
      }),
    ).toBe('opening');
    expect(
      resolveLaunchTarget({
        status: 'signed-out',
        prefsLoading: false,
        hasCompletedOnboarding: false,
        enteredOpening: true,
      }),
    ).toBe('auth');
  });
});
