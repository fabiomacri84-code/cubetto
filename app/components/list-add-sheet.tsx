"use client";

import { addItem } from "../actions";
import { AddSheet, type AddSheetAction, type IconInfer } from "./add-sheet";
import { inferIcon } from "../lib/icon-inference";

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
  const iconInfer: IconInfer = inferIcon;

  return (
    <AddSheet
      hidden={{ name: "listId", value: listId }}
      action={action}
      suggestions={suggestions}
      iconInitial="📦"
      onIconInfer={iconInfer}
    />
  );
}