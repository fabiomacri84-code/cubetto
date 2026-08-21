"use client";

import { useRef, useState } from "react";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

type ServerAction = (formData: FormData) => Promise<void>;

export function JoinSheet({ action }: { action: ServerAction }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  function openSheet() {
    setError(null);
    setOpen(true);
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await action(new FormData(event.currentTarget));
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Qualcosa è andato storto.",
      );
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-surface px-4 py-3.5 text-sm font-semibold text-text-2 transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-strong"
      >
        <span aria-hidden>🔗</span>
        Partecipa con codice invito
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Partecipa a una lista"
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
              <h2 className="text-xl font-bold text-text">
                Partecipa a una lista
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm leading-6 text-text-3">
              Inserisci il codice che ti ha condiviso chi ha creato la lista.
            </p>

            <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4 pb-2">
              <Field label="Codice di invito">
                <Input
                  ref={codeRef}
                  name="inviteCode"
                  type="text"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="es. A1B2C3D4"
                  className="uppercase"
                />
              </Field>

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
                {pending ? "Entro…" : "Unisciti"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}