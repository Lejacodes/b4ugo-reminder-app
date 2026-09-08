export type ErrandItem = {
  id: string;
  title: string;
  placeName: string | null;
};

export type ErrandGroup = {
  placeName: string;
  items: { id: string; title: string }[];
};

const UNPLACED = 'Along the way';

/** Group open errands by saved place, keeping first-seen place order. */
export function groupErrandsByPlace(items: ErrandItem[]): ErrandGroup[] {
  const groups: ErrandGroup[] = [];
  const index = new Map<string, ErrandGroup>();

  for (const item of items) {
    const placeName = item.placeName?.trim() || UNPLACED;
    const key = placeName.toLowerCase();
    let group = index.get(key);
    if (!group) {
      group = { placeName, items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push({ id: item.id, title: item.title });
  }

  return groups;
}
