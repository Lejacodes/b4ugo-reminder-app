import { resolveEasProjectId } from '@/lib/notifications/push-token';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
    easConfig: undefined,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('resolveEasProjectId', () => {
  test('reads project id from expo config extra', () => {
    expect(resolveEasProjectId()).toBe('test-project-id');
  });
});
