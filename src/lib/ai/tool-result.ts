import type { AIToolName } from './types';

export const NO_CHECKED_ITEMS_MESSAGE = "I couldn't find any checked items to remove.";

const DESTRUCTIVE_TOOLS = new Set<string>([
  'deleteReminder',
  'completeAllReminders',
  'removePackingItem',
  'deleteSavedPlace',
  'deleteTrip',
  'deleteIntention',
]);

const CREATION_TOOLS = new Set<string>([
  'createReminder',
  'createTrip',
  'createSavedPlace',
  'addIntention',
  'addPackingItem',
  'addPersonalNecessity',
]);

const MUTATION_TOOLS = new Set<string>([
  ...DESTRUCTIVE_TOOLS,
  'createReminder',
  'createTrip',
  'createSavedPlace',
  'addIntention',
  'addPackingItem',
  'addPersonalNecessity',
  'completeReminder',
  'updateReminder',
  'updateTrip',
  'updateSavedPlace',
  'updateIntention',
  'togglePackingItem',
  'toggleAllPackingItems',
]);

export type CreationResult =
  | { success: true; displayName: string }
  | { success: false; error?: string };

export function creationResult(displayName: string): CreationResult {
  const normalized = displayName.trim();
  return normalized
    ? { success: true, displayName: normalized }
    : { success: false, error: "i couldn't confirm what was saved." };
}

export function verifiedCreationResult(name: string, payload: unknown): CreationResult | null {
  if (!CREATION_TOOLS.has(name) || !payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  if (data.success !== true) {
    return {
      success: false,
      ...(typeof data.error === 'string' && data.error.trim() ? { error: data.error.trim() } : {}),
    };
  }
  if (typeof data.displayName !== 'string' || !data.displayName.trim()) {
    return { success: false, error: "i couldn't confirm what was saved." };
  }
  return { success: true, displayName: data.displayName.trim() };
}

export type ToolMutationResult = {
  success: boolean;
  deletedCount?: number;
  updatedCount?: number;
  completedCount?: number;
  completed?: number;
  toggled?: number;
  error?: string;
};

export function deletionResult(deletedCount: number): ToolMutationResult {
  return {
    success: deletedCount > 0,
    deletedCount,
  };
}

export function mutationCounts(payload: unknown): {
  success: boolean;
  deletedCount: number;
  updatedCount: number;
  completedCount: number;
  error?: string;
} {
  if (!payload || typeof payload !== 'object') {
    return { success: false, deletedCount: 0, updatedCount: 0, completedCount: 0 };
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.error === 'string' && data.error.trim()) {
    return {
      success: false,
      deletedCount: 0,
      updatedCount: 0,
      completedCount: 0,
      error: data.error,
    };
  }

  const deletedCount = asCount(data.deletedCount) || (data.deleted === true ? 1 : 0);
  const completedCount = asCount(data.completedCount) || asCount(data.completed);
  const updatedCount =
    asCount(data.updatedCount) || asCount(data.toggled) || (data.updated === true || data.toggled === true ? 1 : 0);
  const success =
    typeof data.success === 'boolean'
      ? data.success
      : data.deleted === true ||
        data.updated === true ||
        data.completed === true ||
        deletedCount > 0 ||
        completedCount > 0 ||
        updatedCount > 0;

  return { success, deletedCount, updatedCount, completedCount };
}

export function isDestructiveTool(name: string): boolean {
  return DESTRUCTIVE_TOOLS.has(name);
}

export function isMutationTool(name: string): boolean {
  return MUTATION_TOOLS.has(name);
}

export function isEmptyDestructive(item: { name: string; payload: unknown }): boolean {
  if (!isDestructiveTool(item.name)) return false;
  const counts = mutationCounts(item.payload);
  if (counts.error) return false;
  return !counts.success || (counts.deletedCount <= 0 && counts.completedCount <= 0);
}

export function formatVerifiedMutation(name: string, payload: unknown): string | null {
  if (!isDestructiveTool(name) && name !== 'completeReminder' && name !== 'updateReminder' && name !== 'updateTrip' && name !== 'updateSavedPlace' && name !== 'updateIntention' && name !== 'togglePackingItem' && name !== 'toggleAllPackingItems') {
    return null;
  }

  const counts = mutationCounts(payload);
  if (counts.error) return counts.error;

  if (isDestructiveTool(name)) {
    const count = counts.deletedCount || counts.completedCount;
    if (!counts.success || count <= 0) return NO_CHECKED_ITEMS_MESSAGE;
    if (name === 'completeAllReminders') {
      return count === 1 ? 'checked off your reminder ✨' : `checked off ${count} reminders ✨`;
    }
    return count === 1 ? 'removed it ♡' : `removed ${count} ♡`;
  }

  if (name === 'completeReminder') {
    return counts.success ? 'one less thing to remember ✨' : 'i need to know which reminder you mean.';
  }

  if (
    name === 'updateReminder' ||
    name === 'updateTrip' ||
    name === 'updateSavedPlace' ||
    name === 'updateIntention'
  ) {
    return counts.success ? 'updated ♡' : counts.error ?? 'nothing changed.';
  }

  if (name === 'togglePackingItem') {
    return counts.success ? 'marked on your packing list ♡' : 'which packing item?';
  }

  if (name === 'toggleAllPackingItems') {
    const count = counts.updatedCount;
    if (!count) return 'everything on your packing list was already packed.';
    return count === 1 ? 'marked 1 packing item packed ♡' : `marked ${count} packing items packed ♡`;
  }

  return null;
}

export function composeVerifiedReply(
  preamble: string,
  results: { name: AIToolName | string; payload: unknown }[],
  format: (name: string, payload: unknown) => string,
  emptyFallback: string,
): string {
  const extras = results
    .map((item) => {
      if (item.payload && typeof item.payload === 'object' && 'error' in item.payload) {
        const error = String((item.payload as { error: unknown }).error);
        if (error.trim()) return error;
      }
      return format(item.name, item.payload);
    })
    .filter(Boolean);

  if (results.some((item) => isDestructiveTool(item.name))) {
    return extras.join('\n') || emptyFallback;
  }

  // For mutations, the store result is the source of truth. Prefer it over a
  // model's generic preamble so repeated saves do not all sound identical and
  // the assistant never claims success before the write is verified.
  if (results.some((item) => isMutationTool(item.name))) {
    return extras.join('\n') || emptyFallback;
  }

  return [preamble, ...extras].filter(Boolean).join('\n') || emptyFallback;
}

export function guardAssistantClaims(
  message: string,
  results: { name: string; payload: unknown }[],
  format: (name: string, payload: unknown) => string,
  emptyFallback: string,
): string {
  if (!results.length) return message.trim() || emptyFallback;
  if (results.some((item) => isMutationTool(item.name))) {
    return composeVerifiedReply('', results, format, emptyFallback);
  }
  return message.trim() || emptyFallback;
}

function asCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}
