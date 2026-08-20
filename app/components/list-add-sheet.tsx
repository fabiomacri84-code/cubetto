"use client";

import { addItem } from "../actions";
import { AddSheet, type AddSheetAction } from "./add-sheet";

type Category = { id: string; name: string; emoji: string };
type Suggestion = {
  name: string;
  emoji: string;
  quantity?: number;
  categoryId?: string | null;
};

export function ListAddSheet({
  listId,
  categories,
  suggestions,
}: {
  listId: string;
  categories: Category[];
  suggestions: Suggestion[];
}) {
  const action: AddSheetAction = (formData) => addItem({ ok: false }, formData);

  return (
    <AddSheet
      hidden={{ name: "listId", value: listId }}
      action={action}
      categories={categories}
      suggestions={suggestions}
    />
  );
}