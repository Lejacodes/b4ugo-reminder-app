import React from 'react';
import { act, create } from 'react-test-renderer';
import { ReminderProvider, useReminders } from '@/store/ReminderProvider';

const mockDisk = new Map<string, string>();
let mockFail = false;
let mockUser = 'provider-a';
jest.mock('@/store/AuthProvider', () => ({ useAuth: () => ({ status: 'signed-in', user: { id: mockUser } }) }));
jest.mock('@/lib/storage/preferences-storage', () => {
  const keys = Object.fromEntries(['reminders','necessities','context','trips','packingItems','packingTemplates','travelIntentions','savedPlaces','profile','preferences','departureSession'].map((name) => [name, `blugo.${name}`]));
  return {
    STORAGE_KEYS: keys,
    scopedKey: (base: string, user: string) => `${base}.${user}`,
    ensureLocalRecordsMigrated: async () => ({}),
    preferencesStorage: {
      getItem: async (key: string) => mockDisk.get(key) ?? null,
      setItem: async (key: string, value: string) => { if (mockFail) throw new Error('storage unavailable'); mockDisk.set(key, value); },
    },
  };
});
jest.mock('@/lib/engines', () => ({
  ...jest.requireActual('@/lib/engines/reminder-store'),
  placeService: { resolve: async (placeName: string) => ({ placeName, latitude: null, longitude: null }) },
  weatherService: { getSnapshot: async () => null },
  suggestionEngine: { getTripPack: () => [], getSuggestions: () => [] },
}));
jest.mock('@/lib/geocoding', () => ({ geocodingService: { searchDestination: async () => null } }));

let current: ReturnType<typeof useReminders>;
function Probe() {
  const value = useReminders();
  React.useEffect(() => { current = value; }, [value]);
  return null;
}
function element() {
  return React.createElement(React.Fragment, { key: mockUser }, React.createElement(ReminderProvider, null, React.createElement(Probe)));
}

describe('mounted reminder provider + durable repository commands', () => {
  beforeAll(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });
  beforeEach(() => { mockDisk.clear(); mockFail = false; mockUser = 'provider-a'; });

  it('reports a persisted entity, detects duplicates, and restores after provider restart', async () => {
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(element()); });
    let first: Awaited<ReturnType<typeof current.addReminder>>;
    await act(async () => { first = await current.addReminder({ title: 'Take passport', category: 'specific' }); });
    expect(first!.status).toBe('persisted');
    expect(first!.entity.id).toBeTruthy();
    let duplicate: Awaited<ReturnType<typeof current.addReminder>>;
    await act(async () => { duplicate = await current.addReminder({ title: 'Take passport', category: 'specific' }); });
    expect(duplicate!.status).toBe('unchanged');
    expect(duplicate!.entity.id).toBe(first!.entity.id);
    await act(async () => { view!.unmount(); });
    await act(async () => { view = create(element()); });
    expect(current.reminders.filter((record) => record.title === 'Take passport')).toHaveLength(1);
    await act(async () => { view!.unmount(); });
  });

  it('rejects a failed local commit and leaves the visible list unchanged', async () => {
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(element()); });
    const before = current.reminders;
    mockFail = true;
    await act(async () => {
      await expect(current.addReminder({ title: 'Must not appear saved', category: 'specific' })).rejects.toThrow('storage unavailable');
    });
    expect(current.reminders).toEqual(before);
    mockFail = false;
    await act(async () => { view!.unmount(); });
  });

  it('clears account A projections when the account scope switches to B', async () => {
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(element()); });
    await act(async () => { await current.addReminder({ title: 'A private reminder', category: 'specific' }); });
    mockUser = 'provider-b';
    await act(async () => { view!.update(element()); });
    expect(current.reminders.some((item) => item.title === 'A private reminder')).toBe(false);
    await act(async () => { view!.unmount(); });
  });
});
