import {
  DEPARTURE_WIFI_COOLDOWN_MS,
  isMorningDepartureWindow,
  isWifiDepartureTransition,
  networkKindFromState,
} from '@/lib/notifications/departure-trigger';

describe('wifi departure trigger', () => {
  it('detects wifi to cellular or offline transitions', () => {
    expect(isWifiDepartureTransition('wifi', 'cellular')).toBe(true);
    expect(isWifiDepartureTransition('wifi', 'offline')).toBe(true);
    expect(isWifiDepartureTransition('cellular', 'wifi')).toBe(false);
    expect(isWifiDepartureTransition('wifi', 'wifi')).toBe(false);
  });

  it('maps netinfo states into departure network kinds', () => {
    expect(networkKindFromState({ type: 'wifi', isConnected: true })).toBe('wifi');
    expect(networkKindFromState({ type: 'cellular', isConnected: true })).toBe('cellular');
    expect(networkKindFromState({ type: 'none', isConnected: false })).toBe('offline');
  });

  it('only fires during the morning departure window', () => {
    expect(isMorningDepartureWindow(new Date('2026-09-08T08:30:00'))).toBe(true);
    expect(isMorningDepartureWindow(new Date('2026-09-08T06:59:00'))).toBe(false);
    expect(isMorningDepartureWindow(new Date('2026-09-08T11:00:00'))).toBe(false);
  });

  it('uses a three hour cooldown buffer', () => {
    expect(DEPARTURE_WIFI_COOLDOWN_MS).toBe(3 * 60 * 60 * 1000);
  });
});
