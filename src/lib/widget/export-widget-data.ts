import { preferencesStorage, scopedKey, STORAGE_KEYS } from '@/lib/storage/preferences-storage';
import type { DepartureBoardItem } from '@/lib/home/departure-board';

/** iOS App Group identifier for widget extensions. */
export const WIDGET_APP_GROUP = 'group.com.b4ugo.app';

/** Shared key written for native widget extensions to read. */
export const WIDGET_SHARED_KEY = `${WIDGET_APP_GROUP}.departureBoard`;

export type WidgetBoardItem = {
  id: string;
  title: string;
  isPacked: boolean;
  icon: string;
};

export type WidgetBoardPayload = {
  items: WidgetBoardItem[];
  updatedAt: string;
};

function iconForKind(kind: DepartureBoardItem['kind']): string {
  switch (kind) {
    case 'packing':
      return 'briefcase';
    case 'weather':
      return 'cloud';
    case 'reminder':
      return 'checkmark-circle';
    case 'necessity':
    default:
      return 'key';
  }
}

export function buildWidgetPayload(board: DepartureBoardItem[]): WidgetBoardPayload {
  const items = board
    .filter((item) => !item.checked)
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      isPacked: item.checked,
      icon: iconForKind(item.kind),
    }));

  return {
    items,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Serialize the doorway board for home-screen widgets. Writes locally and
 * mirrors to the App Group key native extensions can sync from.
 */
export async function exportWidgetData(
  board: DepartureBoardItem[],
  userId?: string | null,
): Promise<void> {
  const payload = buildWidgetPayload(board);
  const raw = JSON.stringify(payload);

  try {
    if (userId) {
      await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.widgetBoard, userId), raw);
    }
    await preferencesStorage.setItem(WIDGET_SHARED_KEY, raw);
  } catch {
    // Widget export is best-effort and must not block the app.
  }
}
