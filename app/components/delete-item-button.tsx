"use client";

import { useFormStatus } from "react-dom";
import { deleteItem } from "../actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-text-3 hover:bg-negative-soft hover:text-negative disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function DeleteItemButton({
  itemId,
  name,
}: {
  itemId: string;
  name: string;
}) {
  return (
    <form
      action={deleteItem}
      onSubmit={(event) => {
        if (!confirm(`Eliminare "${name}" dalla lista?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={itemId} />
      <SubmitButton label="Elimina" />
    </form>
  );
}