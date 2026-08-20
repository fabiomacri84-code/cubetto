"use client";

import { addPackItem } from "../actions";
import { AddSheet, type AddSheetAction } from "./add-sheet";

type Category = { id: string; name: string; emoji: string };
type Suggestion = {
  name: string;
  emoji: string;
  quantity?: number;
  categoryId?: string | null;
};

export function PackAddSheet({
  packId,
  categories,
  suggestions,
}: {
  packId: string;
  categories: Category[];
  suggestions: Suggestion[];
}) {
  const action: AddSheetAction = async (formData) => {
    await addPackItem(formData);
    return { ok: true };
  };

  return (
    <AddSheet
      hidden={{ name: "packId", value: packId }}
      action={action}
      categories={categories}
      suggestions={suggestions}
      iconInitial="📦"
    />
  );
}