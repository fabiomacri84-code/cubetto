"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addItem } from "../actions";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { IconPicker } from "./icon-picker";

type State = { ok: boolean; error?: string };
type CategoryOption = { id: string; name: string; emoji: string };

export function AddItemForm({
  listId,
  categories,
}: {
  listId: string;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await addItem(_prev, formData);

      if (result.ok) {
        setOpen(false);
        formRef.current?.reset();
        setToast("Aggiunto ✓");
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2000);
      }

      return result;
    },
    { ok: false },
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="rounded-md border border-line-strong bg-subtle">
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center">
          <div className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-2 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
          ＋
        </span>
        Aggiungi elemento
        <span
          className={`ml-auto text-text-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-3 border-t border-line-soft p-3"
        >
          <input type="hidden" name="listId" value={listId} />
          <div className="flex gap-2">
            <IconPicker initial="📦" />
            <Field label="Nome">
              <Input
                name="name"
                type="text"
                required
                autoFocus
                placeholder="es. Maglietta rossa"
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Field label="Quantità">
              <Input
                name="quantity"
                type="number"
                min={1}
                max={999}
                defaultValue={1}
                className="min-h-9 w-20"
              />
            </Field>
            <Field label="Categoria">
              <select
                name="categoryId"
                className="min-h-10 w-full rounded-md border border-line-strong bg-subtle px-2 py-1.5 text-base text-text outline-none focus:border-accent"
              >
                <option value="">Senza categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {state.error ? (
            <p className="text-xs text-error">{state.error}</p>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Aggiungo…" : "Aggiungi"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}