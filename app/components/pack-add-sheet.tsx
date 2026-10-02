"use client";

import { addPackItem } from "../actions";
import { AddSheet, type AddSheetAction, type IconInfer } from "./add-sheet";
import { inferIcon } from "../lib/icon-inference";

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
  const iconInfer: IconInfer = inferIcon;

  return (
    <AddSheet
      hidden={{ name: "packId", value: packId }}
      action={action}
      suggestions={suggestions}
      iconInitial="📦"
      onIconInfer={iconInfer}
    />
  );
}