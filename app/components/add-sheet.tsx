"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { IconPicker } from "./icon-picker";
import { cn } from "./ui/cn";

type Suggestion = {
  name: string;
  emoji: string;
  quantity?: number;
};
type ActionResult = { ok: boolean; error?: string };

export type AddSheetAction = (formData: FormData) => Promise<ActionResult>;
export type IconInfer = (name: string) => Promise<string>;

export function AddSheet({
  fabLabel = "Aggiungi elemento",
  title = "Cosa devi aggiungere?",
  placeholder = "Cosa devi aggiungere?",
  cta = "Aggiungi",
  iconInitial = "📦",
  hidden,
  action,
  suggestions,
  onIconInfer,
}: {
  fabLabel?: string;
  title?: string;
  placeholder?: string;
  cta?: string;
  iconInitial?: string;
  hidden: { name: string; value: string };
  action: AddSheetAction;
  suggestions: Suggestion[];
  onIconInfer?: IconInfer;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [currentIcon, setCurrentIcon] = useState(iconInitial);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inferTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inferAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (inferTimer.current) clearTimeout(inferTimer.current);
      if (inferAbort.current) inferAbort.current.abort();
    };
  }, []);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return suggestions;
    return suggestions
      .filter((s) => s.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [query, suggestions]);

  const inferIcon = useCallback(async (name: string) => {
    if (!onIconInfer || !name.trim()) return;
    if (inferAbort.current) inferAbort.current.abort();
    inferAbort.current = new AbortController();
    try {
      const emoji = await onIconInfer(name);
      if (!inferAbort.current.signal.aborted) {
        setCurrentIcon(emoji);
      }
    } catch {
    }
  }, [onIconInfer]);

  const handleNameChange = (value: string) => {
    setQuery(value);
    if (inferTimer.current) clearTimeout(inferTimer.current);
    inferTimer.current = setTimeout(() => {
      inferIcon(value);
    }, 300);
  };

  function openSheet() {
    setQuery("");
    setCurrentIcon(iconInitial);
    setError(null);
    setOpen(true);
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  function closeSheet() {
    setOpen(false);
    setError(null);
    setPending(false);
    if (inferTimer.current) clearTimeout(inferTimer.current);
    if (inferAbort.current) inferAbort.current.abort();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await action(new FormData(event.currentTarget)).catch(
      (err: unknown) => ({
        ok: false as const,
        error:
          err instanceof Error ? err.message : "Qualcosa è andato storto.",
      }),
    );

    setPending(false);

    if (!result.ok) {
      setError(result.error ?? "Qualcosa è andato storto.");
      return;
    }

    formRef.current?.reset();
    setToast(`${cta}to ✓`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
    closeSheet();
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="fab inline-flex items-center gap-2 px-6 text-base font-semibold"
        aria-haspopup="dialog"
      >
        <span className="text-2xl leading-none" aria-hidden>
          ＋
        </span>
        {fabLabel}
      </button>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lift">
            {toast}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Chiudi"
            onClick={closeSheet}
            className="sheet-backdrop absolute inset-0 h-full w-full cursor-default"
          />
          <div className="sheet absolute inset-x-0 bottom-0 flex flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:w-full lg:max-w-lg lg:-translate-x-1/2 lg:rounded-[var(--radius-3xl)]">
            <span className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-line-strong" />

            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">{title}</h2>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Chiudi"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
              >
                ✕
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="mt-3 flex flex-col gap-4 overflow-y-auto pb-2"
            >
              <input type="hidden" name={hidden.name} value={hidden.value} />

              <Field label="Nome">
                <Input
                  ref={nameRef}
                  name="name"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </Field>

              {matches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matches.map((suggestion) => (
                    <button
                      key={`${suggestion.name}-${suggestion.emoji}`}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion.name);
                        setCurrentIcon(suggestion.emoji);
                      }}
                      className="chip flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-2 hover:bg-subtle"
                    >
                      <span aria-hidden>{suggestion.emoji}</span>
                      <span className="max-w-40 truncate">{suggestion.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <Field label="Quantità">
                <Input
                  name="quantity"
                  type="number"
                  min={1}
                  max={999}
                  defaultValue={1}
                  inputMode="numeric"
                />
              </Field>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-2">Icona</span>
                <IconPicker initial={currentIcon} />
              </div>

              {error ? (
                <p className="rounded-xl border border-negative/30 bg-negative-soft px-3 py-2 text-sm text-negative">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong disabled:opacity-50"
              >
                {pending ? "Aggiungo…" : cta}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}