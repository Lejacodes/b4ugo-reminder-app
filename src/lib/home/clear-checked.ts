import type { DepartureSession } from '@/lib/home/departure-session';

export type ClearCheckedItem = {
  persistKind: 'session' | 'reminder' | 'packing';
  checked: boolean;
  id: string;
  reminderId?: string;
  weatherId?: string;
  packingItemId?: string;
};

export type ClearCheckedPlan = {
  nextSession: DepartureSession;
  reminderIdsToDelete: string[];
};

/**
 * Checked session rows leave the board for this departure (cleared keys).
 * Done reminder rows are deleted. Base PersonalNecessity records are untouched.
 */
export function planClearChecked(items: ClearCheckedItem[], session: DepartureSession): ClearCheckedPlan {
  const checks = { ...session.checks };
  const dismissed = [...session.dismissed];
  const cleared = [...(session.cleared ?? [])];
  const reminderIdsToDelete: string[] = [];

  for (const item of items) {
    if (!item.checked) continue;

    if (item.persistKind === 'reminder' && item.reminderId) {
      reminderIdsToDelete.push(item.reminderId);
      continue;
    }

    if (item.persistKind === 'packing') {
      continue;
    }

    delete checks[item.id];
    if (!cleared.includes(item.id)) cleared.push(item.id);
    if (item.weatherId && !dismissed.includes(item.weatherId)) {
      dismissed.push(item.weatherId);
    }
  }

  return {
    nextSession: {
      ...session,
      checks,
      dismissed,
      cleared,
    },
    reminderIdsToDelete,
  };
}
