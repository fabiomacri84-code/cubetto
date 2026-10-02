"use client";

import { addItem } from "../actions";
import { AddSheet, type AddSheetAction } from "./add-sheet";

type Suggestion = {
  name: string;
  emoji: string;
  quantity?: number;
};

export function ListAddSheet({
  listId,
  suggestions,
}: {
  listId: string;
  suggestions: Suggestion[];
}) {
  const action: AddSheetAction = async (formData) => addItem({ ok: false }, formData);

  return (
    <AddSheet
      hidden={{ name: "listId", value: listId }}
      action={action}
      suggestions={suggestions}
      iconInitial="📦"
    />
  );
}