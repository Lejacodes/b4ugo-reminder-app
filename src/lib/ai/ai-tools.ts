import type { AIToolCall, AIToolName, ValidatedTool } from './types';
import { isExplicitConfirm } from './resolve-entity';

export const AI_TOOL_NAMES: AIToolName[] = [
  'createReminder',
  'updateReminder',
  'deleteReminder',
  'completeReminder',
  'completeAllReminders',
  'createSavedPlace',
  'updateSavedPlace',
  'deleteSavedPlace',
  'createTrip',
  'updateTrip',
  'deleteTrip',
  'getTrip',
  'getUpcomingTrips',
  'getPackingList',
  'addPackingItem',
  'removePackingItem',
  'togglePackingItem',
  'toggleAllPackingItems',
  'suggestPacking',
  'getPersonalNecessities',
  'addPersonalNecessity',
  'addIntention',
  'updateIntention',
  'deleteIntention',
  'getTodayContext',
  'getUpcomingContext',
  'getWeather',
];

const GENERIC_PLACES = new Set([
  'supermarket',
  'the supermarket',
  'a supermarket',
  'store',
  'the store',
  'shop',
  'the shop',
  'mall',
  'the mall',
  'market',
  'the market',
  'grocery',
  'grocery store',
]);

const DESTRUCTIVE = new Set<AIToolName>([
  'deleteReminder',
  'deleteSavedPlace',
  'deleteTrip',
  'removePackingItem',
  'deleteIntention',
]);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isGenericPlaceName(value: string | null | undefined): boolean {
  const name = (value ?? '').trim().toLowerCase();
  return name.length > 0 && GENERIC_PLACES.has(name);
}

export function validateToolCall(call: AIToolCall): ValidatedTool {
  if (!AI_TOOL_NAMES.includes(call.name)) {
    return { ok: false, reason: 'invalid', message: 'i do not know that action.' };
  }

  const args = call.args ?? {};

  if (call.name === 'createReminder') {
    const title = text(args.title);
    if (!title) return { ok: false, reason: 'invalid', message: 'what should i remember?' };
    if (isGenericPlaceName(text(args.placeName))) {
      const label = text(args.placeName).replace(/^the /i, '');
      return { ok: false, reason: 'ambiguous', message: `which ${label} should i keep that for? ♡` };
    }
    return {
      ok: true,
      name: call.name,
      args: {
        title,
        category: text(args.category) || 'specific',
        placeName: text(args.placeName) || null,
        dueAt: text(args.dueAt) || null,
      },
    };
  }

  if (call.name === 'completeAllReminders') {
    return { ok: true, name: call.name, args: {} };
  }

  if (call.name === 'toggleAllPackingItems') {
    return { ok: true, name: call.name, args: { ...args } };
  }

  if (call.name === 'updateReminder' || call.name === 'completeReminder' || call.name === 'deleteReminder') {
    const id = text(args.id);
    const hint = text(args.title) || text(args.hint);
    if (!id && !hint) {
      return {
        ok: false,
        reason: 'destructive',
        message: 'i need to know which reminder you mean.',
      };
    }
    if (call.name === 'deleteReminder' && !isExplicitConfirm(args.confirm)) {
      return { ok: false, reason: 'destructive', message: 'say so clearly if you want me to delete that.' };
    }
    return { ok: true, name: call.name, args: { ...args, id } };
  }

  if (call.name === 'createSavedPlace') {
    const name = text(args.name);
    if (!name) return { ok: false, reason: 'invalid', message: 'which place should i save?' };
    if (isGenericPlaceName(name)) {
      const label = name.replace(/^the /i, '');
      return { ok: false, reason: 'ambiguous', message: `which ${label} should i keep that for? ♡` };
    }
    return { ok: true, name: call.name, args: { name, label: text(args.label) || null } };
  }

  if (call.name === 'updateSavedPlace' || call.name === 'deleteSavedPlace') {
    const id = text(args.id);
    const hint = text(args.name) || text(args.hint);
    if (!id && !hint) return { ok: false, reason: 'destructive', message: 'which saved place?' };
    if (call.name === 'deleteSavedPlace' && !isExplicitConfirm(args.confirm)) {
      return { ok: false, reason: 'destructive', message: 'say so clearly if you want me to delete that place.' };
    }
    return { ok: true, name: call.name, args: { ...args, id } };
  }

  if (call.name === 'createTrip') {
    const destination = text(args.destination);
    if (!destination) return { ok: false, reason: 'invalid', message: 'where are you going?' };
    return {
      ok: true,
      name: call.name,
      args: {
        title: text(args.title) || destination,
        destination,
        startDate: text(args.startDate) || null,
        endDate: text(args.endDate) || null,
        activity: text(args.activity) || null,
        accommodation: text(args.accommodation) || null,
        transportation: text(args.transportation) || null,
      },
    };
  }

  if (call.name === 'updateTrip' || call.name === 'deleteTrip' || call.name === 'getTrip' || call.name === 'getPackingList' || call.name === 'suggestPacking') {
    const id = text(args.id) || text(args.tripId);
    if ((call.name === 'updateTrip' || call.name === 'deleteTrip' || call.name === 'getTrip') && !id && !text(args.destination) && !text(args.title)) {
      return { ok: false, reason: 'invalid', message: 'which trip?' };
    }
    if (call.name === 'deleteTrip' && !isExplicitConfirm(args.confirm)) {
      return { ok: false, reason: 'destructive', message: 'say so clearly if you want me to delete that trip.' };
    }
    return { ok: true, name: call.name, args: { ...args, id: id || null } };
  }

  if (call.name === 'addPackingItem') {
    const title = text(args.title);
    const tripId = text(args.tripId) || text(args.id);
    if (!title) return { ok: false, reason: 'invalid', message: 'what should i add to packing?' };
    return { ok: true, name: call.name, args: { title, tripId, category: text(args.category) || 'other' } };
  }

  if (call.name === 'removePackingItem') {
    const id = text(args.id);
    if (!id && !text(args.title)) {
      return { ok: false, reason: 'destructive', message: 'which packing item should i remove?' };
    }
    if (!isExplicitConfirm(args.confirm)) {
      return { ok: false, reason: 'destructive', message: 'i will not remove packing items unless you are clear.' };
    }
    return { ok: true, name: call.name, args: { id, title: text(args.title) || null, tripId: text(args.tripId) || null } };
  }

  if (call.name === 'togglePackingItem') {
    const id = text(args.id);
    if (!id && !text(args.title)) {
      return { ok: false, reason: 'invalid', message: 'which packing item?' };
    }
    return {
      ok: true,
      name: call.name,
      args: { id: id || null, title: text(args.title) || null, tripId: text(args.tripId) || null },
    };
  }

  if (call.name === 'addPersonalNecessity') {
    const title = text(args.title);
    if (!title) return { ok: false, reason: 'invalid', message: 'what necessity should i keep?' };
    return { ok: true, name: call.name, args: { title } };
  }

  if (call.name === 'addIntention') {
    const title = text(args.title);
    if (!title) return { ok: false, reason: 'invalid', message: 'what do you want to try or visit?' };
    if (isGenericPlaceName(text(args.placeName))) {
      const label = text(args.placeName).replace(/^the /i, '');
      return { ok: false, reason: 'ambiguous', message: `which ${label} should i keep that for? ♡` };
    }
    return {
      ok: true,
      name: call.name,
      args: {
        title,
        type: text(args.type) || 'other',
        tripId: text(args.tripId) || null,
        placeName: text(args.placeName) || null,
        note: text(args.note) || null,
      },
    };
  }

  if (call.name === 'updateIntention' || call.name === 'deleteIntention') {
    const id = text(args.id);
    if (!id && !text(args.title)) {
      return { ok: false, reason: 'invalid', message: 'which plan or intention?' };
    }
    if (call.name === 'deleteIntention' && !isExplicitConfirm(args.confirm)) {
      return { ok: false, reason: 'destructive', message: 'say so clearly if you want me to delete that.' };
    }
    return { ok: true, name: call.name, args: { ...args, id: id || null } };
  }

  if (DESTRUCTIVE.has(call.name)) {
    return { ok: false, reason: 'destructive', message: 'i will not do that without a clear id.' };
  }

  return { ok: true, name: call.name, args };
}

export function protectNecessitiesFromPacking(call: AIToolCall): ValidatedTool | null {
  if (call.name === 'removePackingItem' || call.name === 'addPackingItem' || call.name === 'suggestPacking') {
    if (call.args?.modifyNecessities === true || call.args?.deleteNecessity === true) {
      return {
        ok: false,
        reason: 'protected',
        message: 'packing cannot change your personal necessities.',
      };
    }
  }
  return null;
}
