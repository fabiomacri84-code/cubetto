import { describe, expect, it } from "vitest";
import { groupByCategory } from "../../app/lib/items";
import type { GroupableItem } from "../../app/lib/items";

function item(overrides: Partial<GroupableItem>): GroupableItem {
  return {
    id: "i1",
    name: "Elemento",
    emoji: "📦",
    quantity: 1,
    checked: false,
    stored: false,
    imageUrl: null,
    sortOrder: 0,
    category: null,
    ...overrides,
  };
}

describe("groupByCategory", () => {
  it("raggruppa gli item per categoria in ordine di sortOrder", () => {
    const items = [
      item({ id: "a", category: { id: "c1", name: "Casa", emoji: "🧽" }, sortOrder: 2 }),
      item({ id: "b", category: { id: "c2", name: "Frutta", emoji: "🍎" }, sortOrder: 1 }),
      item({ id: "c", category: { id: "c1", name: "Casa", emoji: "🧽" }, sortOrder: 0 }),
    ];

    const groups = groupByCategory(items);
    const casa = groups.find((g) => g.key === "c1");
    const frutta = groups.find((g) => g.key === "c2");

    expect(casa?.items.map((i) => i.id)).toEqual(["c", "a"]);
    expect(frutta?.items.map((i) => i.id)).toEqual(["b"]);
  });

  it("mette gli item senza categoria nel gruppo Senza categoria", () => {
    const groups = groupByCategory([
      item({ id: "x", category: null }),
      item({ id: "y", category: { id: "c1", name: "Casa", emoji: "🧽" } }),
    ]);

    const none = groups.find((g) => g.key === "none");
    expect(none?.name).toBe("Senza categoria");
    expect(none?.emoji).toBe("🗂️");
    expect(none?.items.map((i) => i.id)).toEqual(["x"]);
  });

  it("preserva l'ordine dei gruppi nell'ordine di primo incontro", () => {
    const items = [
      item({ id: "a", category: { id: "c2", name: "B", emoji: "😀" } }),
      item({ id: "b", category: { id: "c1", name: "A", emoji: "😀" } }),
    ];

    expect(groupByCategory(items).map((g) => g.key)).toEqual(["c2", "c1"]);
  });
});