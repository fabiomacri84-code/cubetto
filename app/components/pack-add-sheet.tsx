"use client";

import { addPackItem } from "../actions";
import { AddSheet, type AddSheetAction } from "./add-sheet";

type Suggestion = {
  name: string;
  emoji: string;
  quantity?: number;
};

export function PackAddSheet({
  packId,
  suggestions,
}: {
  packId: string;
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
      suggestions={suggestions}
      iconInitial="📦"
    />
  );
}