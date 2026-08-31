import { resolvePackingItemId, resolveReminderId, resolveTripId, isExplicitConfirm } from '@/lib/ai/resolve-entity';
import type { AIContextSnapshot } from '@/lib/ai/types';

const context: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [{ id: 'r1', title: 'buy sunscreen', category: 'specific', status: 'open', place: null, dueAt: null }],
  necessities: [],
  trips: [{ id: 't1', title: 'Antalya', destination: 'Antalya', startDate: null, endDate: null, durationDays: 5, activity: null, packed: 0, total: 2 }],
  places: [{ id: 'pl1', name: 'Carrefour', type: 'place' }],
  intentions: [{ id: 'i1', tripId: 't1', title: 'try a café', type: 'food', placeName: 'Antalya' }],
  packing: [{ id: 'pk1', tripId: 't1', title: 'passport', checked: false }],
  weather: null,
  activeDestination: null,
};

describe('resolve entities for tool actions', () => {
  it('resolves reminders by title hint', () => {
    expect(resolveReminderId(context, { title: 'sunscreen' })).toBe('r1');
  });

  it('resolves trips by destination hint', () => {
    expect(resolveTripId(context, { destination: 'antalya' })).toBe('t1');
  });

  it('resolves packing items by title within a trip', () => {
    expect(resolvePackingItemId(context, { title: 'passport', tripId: 't1' })).toBe('pk1');
  });

  it('requires explicit confirm tokens', () => {
    expect(isExplicitConfirm('yes')).toBe(true);
    expect(isExplicitConfirm('maybe')).toBe(false);
  });
});
