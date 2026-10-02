"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconGrid } from "./icon-picker";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

type ServerAction = (formData: FormData) => Promise<void>;

type Category = {
  id: string;
  name: string;
  emoji: string;
};

type ItemEditorProps = {
  item: {
    id: string;
    name: string;
    emoji: string;
    imageUrl: string | null;
    categoryId: string | null;
  };
  setItemImage: ServerAction;
  setItemEmoji: ServerAction;
  clearItemImage: ServerAction;
  updateItemMeta: ServerAction;
  categories: Category[];
  className?: string;
  children?: React.ReactNode;
};

export function ItemEditor({
  item,
  setItemImage,
  setItemEmoji,
  clearItemImage,
  updateItemMeta,
  categories,
  className,
  children,
}: ItemEditorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "details">("image");
  const emojiFormRef = useRef<HTMLFormElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const detailFormRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeSoon = () => setTimeout(() => setOpen(false), 60);

  const trigger = children ? (
    <>{children}</>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
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
                    <form action={setItemImage} className="mt-1">
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
                              closeSoon();
                            }
                          }}
                        />
                      </label>
                    </form>

                    <p className="mt-2 pb-2 text-xs font-semibold uppercase tracking-widest text-text-3">
                      Oppure scegli un&apos;icona
                    </p>
                    <form ref={emojiFormRef} action={setItemEmoji}>
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
                            setTimeout(() => setOpen(false), 300);
                          }}
                        />
                      </div>
                    </form>

                    {item.imageUrl ? (
                      <form action={clearItemImage}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          onClick={closeSoon}
                          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-negative transition-colors hover:bg-negative-soft"
                        >
                          🗑️ Rimuovi foto
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : (
                  <form ref={detailFormRef} action={updateItemMeta} className="mt-4 flex flex-col gap-4 pb-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="emoji" value={item.emoji} />
                    <input type="hidden" name="categoryId" value={item.categoryId ?? ""} />

                    <Field label="Nome">
                      <Input
                        ref={nameInputRef}
                        name="name"
                        defaultValue={item.name}
                        required
                        className="min-h-11"
                      />
                    </Field>

                    <Field label="Categoria">
                      <Select
                        name="categoryId"
                        defaultValue={item.categoryId ?? ""}
                        className="min-h-11 text-base"
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                          const hiddenCat = detailFormRef.current?.querySelector('input[name="categoryId"]') as HTMLInputElement;
                          if (hiddenCat) hiddenCat.value = event.target.value;
                        }}
                      >
                        <option value="">Senza categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <button
                      type="submit"
                      onClick={closeSoon}
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