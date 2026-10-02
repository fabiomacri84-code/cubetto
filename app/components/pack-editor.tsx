"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconGrid } from "./icon-picker";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

type ServerAction = (formData: FormData) => Promise<void>;

type PackEditorProps = {
  pack: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    imageUrl: string | null;
  };
  setPackImage: ServerAction;
  setPackEmoji: ServerAction;
  clearPackImage: ServerAction;
  updatePackMeta: ServerAction;
  className?: string;
};

export function PackEditor({
  pack,
  setPackImage,
  setPackEmoji,
  clearPackImage,
  updatePackMeta,
  className,
}: PackEditorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "details">("image");
  const emojiFormRef = useRef<HTMLFormElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const detailFormRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const save = (action: ServerAction) => async (data: FormData) => {
    setPending(true); setError(null);
    try { await action(data); setOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Salvataggio non riuscito."); }
    finally { setPending(false); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Modifica ${pack.name}`}
        aria-haspopup="dialog"
        className={className ?? "absolute inset-0"}
      />

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-50"
              role="dialog"
              aria-modal="true"
              aria-label={`Modifica ${pack.name}`}
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
                  <h2 className="text-xl font-bold text-text">{pack.name}</h2>
                  {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Chiudi"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 flex gap-1 bg-subtle rounded-xl p-1" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === "image"}
                    onClick={() => setActiveTab("image")}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === "image"
                        ? "bg-surface text-text shadow-sm"
                        : "text-text-2 hover:text-text"
                    }`}
                  >
                    🖼️ Immagine
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "details"}
                    onClick={() => setActiveTab("details")}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === "details"
                        ? "bg-surface text-text shadow-sm"
                        : "text-text-2 hover:text-text"
                    }`}
                  >
                    ✏️ Dettagli
                  </button>
                </div>

                {activeTab === "image" ? (
                  <div className="mt-4 flex flex-col gap-4 pb-2">
                    <form action={save(setPackImage)} className="mt-1">
                      <input type="hidden" name="id" value={pack.id} />
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
                    <form ref={emojiFormRef} action={save(setPackEmoji)}>
                      <input type="hidden" name="id" value={pack.id} />
                      <input
                        ref={emojiInputRef}
                        type="hidden"
                        name="emoji"
                        value={pack.emoji}
                      />
                      <div className="pb-2">
                        <IconGrid
                          value={pack.emoji}
                          onSelect={(emoji) => {
                            if (emojiInputRef.current) {
                              emojiInputRef.current.value = emoji;
                            }
                            emojiFormRef.current?.requestSubmit();

                          }}
                        />
                      </div>
                    </form>

                    {pack.imageUrl ? (
                      <form action={save(clearPackImage)}>
                        <input type="hidden" name="id" value={pack.id} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-negative transition-colors hover:bg-negative-soft"
                        >
                          🗑️ Rimuovi foto
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : (
                  <form ref={detailFormRef} action={save(updatePackMeta)} className="mt-4 flex flex-col gap-4 pb-2">
                    <input type="hidden" name="id" value={pack.id} />
                    <input type="hidden" name="emoji" value={pack.emoji} />
                    <input type="hidden" name="color" value={pack.color} />

                    <Field label="Nome">
                      <Input
                        ref={nameInputRef}
                        name="name"
                        defaultValue={pack.name}
                        required
                        className="min-h-11"
                      />
                    </Field>

                    <Field label="Colore">
                      <Input
                        ref={colorInputRef}
                        name="color"
                        type="color"
                        defaultValue={pack.color}
                        className="min-h-11 w-16 cursor-pointer"
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={pending}
                      className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
                    >
                      Salva
                    </button>
                  </form>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
