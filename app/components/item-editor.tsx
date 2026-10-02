"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconGrid } from "./icon-picker";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

type ServerAction = (formData: FormData) => Promise<void>;

type ItemEditorProps = {
  item: {
    id: string;
    name: string;
    emoji: string;
    imageUrl: string | null;
  };
  setItemImage: ServerAction;
  setItemEmoji: ServerAction;
  clearItemImage: ServerAction;
  updateItemMeta: ServerAction;
  className?: string;
  children?: React.ReactNode;
};

export function ItemEditor({
  item,
  setItemImage,
  setItemEmoji,
  clearItemImage,
  updateItemMeta,
  className,
  children,
}: ItemEditorProps) {
  const [open, setOpen] = useState(false);
  const emojiFormRef = useRef<HTMLFormElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const detailFormRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const save = (action: ServerAction) => async (data: FormData) => {
    setPending(true); setError(null);
    try { await action(data); setOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Salvataggio non riuscito."); }
    finally { setPending(false); }
  };

  const trigger = children ? (
    <div className={className ?? "relative"}>{children}
      <button type="button" onClick={() => { setError(null); setOpen(true); }} aria-label={`Modifica ${item.name}`} aria-haspopup="dialog" className="absolute left-3 top-3 h-12 w-12" />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => { setError(null); setOpen(true); }}
      aria-label={`Modifica ${item.name}`}
      aria-haspopup="dialog"
      className={className ?? "absolute inset-0"}
    />
  );

  return (
    <>
      {trigger}

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-50"
              role="dialog"
              aria-modal="true"
              aria-label={`Modifica ${item.name}`}
            >
              <button
                type="button"
                aria-label="Chiudi"
                onClick={() => setOpen(false)}
                className="sheet-backdrop absolute inset-0 h-full w-full cursor-default"
              />
              <div className="sheet absolute inset-x-0 bottom-0 flex flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:w-full lg:max-w-lg lg:-translate-x-1/2 lg:rounded-[var(--radius-3xl)]">
                <span className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-line-strong" />

                <div className="mt-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text">{item.name}</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Chiudi"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-4 overflow-y-auto pb-2">
                  {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
                  <fieldset disabled={pending} className="contents">
                  <form action={save(setItemImage)} className="mt-1">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-subtle px-4 text-sm font-semibold text-accent-strong transition-colors hover:border-accent hover:bg-accent-soft">
                      <span aria-hidden>📷</span>
                      Scatta o scegli una foto
                      <input
                        type="file"
                        name="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          if (event.currentTarget.files?.length) {
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                      />
                    </label>
                  </form>

                  <p className="mt-2 pb-2 text-xs font-semibold uppercase tracking-widest text-text-3">
                    Oppure scegli un&apos;icona
                  </p>
                  <form ref={emojiFormRef} action={save(setItemEmoji)}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      ref={emojiInputRef}
                      type="hidden"
                      name="emoji"
                      value={item.emoji}
                    />
                    <div className="pb-2">
                      <IconGrid
                        value={item.emoji}
                        onSelect={(emoji) => {
                          if (emojiInputRef.current) {
                            emojiInputRef.current.value = emoji;
                          }
                          emojiFormRef.current?.requestSubmit();
                        }}
                      />
                    </div>
                  </form>

                  {item.imageUrl ? (
                    <form action={save(clearItemImage)}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-negative transition-colors hover:bg-negative-soft"
                      >
                        🗑️ Rimuovi foto
                      </button>
                    </form>
                  ) : null}

                  <hr className="border-line my-2" />

                  <form ref={detailFormRef} action={save(updateItemMeta)} className="mt-2 flex flex-col gap-4 pb-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="emoji" value={item.emoji} />

                    <Field label="Nome">
                      <Input
                        ref={nameInputRef}
                        name="name"
                        defaultValue={item.name}
                        required
                        className="min-h-11"
                      />
                    </Field>

                    <button
                      type="submit"
                      className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
                    >
                      Salva
                    </button>
                  </form>
                  </fieldset>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}