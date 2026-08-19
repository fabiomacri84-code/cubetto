export type GroupableItem = {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  checked: boolean;
  stored: boolean;
  imageUrl: string | null;
  sortOrder: number;
  category: { id: string; name: string; emoji: string } | null;
};

export type CategoryGroup = {
  key: string;
  name: string;
  emoji: string;
  items: GroupableItem[];
};

export function groupByCategory(items: GroupableItem[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();

  for (const item of items) {
    const key = item.category?.id ?? "none";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: item.category?.name ?? "Senza categoria",
        emoji: item.category?.emoji ?? "🗂️",
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    items: group.items.sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}