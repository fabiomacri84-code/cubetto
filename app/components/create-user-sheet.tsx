"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../admin-actions";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

type ActionResult = { ok: boolean; error?: string };

export function CreateUserSheet() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);

  function openSheet() {
    setOpen(true);
    setError(null);
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;

    startTransition(async () => {
      const res = await createUser(new FormData(form)).then(
        () => ({ ok: true as const }),
        (err: unknown) =>
          ({
            ok: false as const,
            error:
              err instanceof Error
                ? err.message
                : "Qualcosa è andato storto. Riprova.",
          }) as ActionResult,
      );

      if (!res.ok) {
        setError(res.error ?? "Qualcosa è andato storto. Riprova.");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-accent px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
      >
        <span className="text-lg leading-none" aria-hidden>
          ＋
        </span>
        Nuovo utente
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Chiudi"
            onClick={() => setOpen(false)}
            className="sheet-backdrop absolute inset-0 h-full w-full cursor-default"
          />
          <div className="sheet absolute inset-x-0 bottom-0 flex flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:w-full lg:max-w-lg lg:-translate-x-1/2 lg:rounded-[var(--radius-3xl)]">
            <span className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-line-strong" />

            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text">Nuovo utente</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-4 pb-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <Input
                    ref={nameRef}
                    name="name"
                    type="text"
                    required
                    autoComplete="off"
                  />
                </Field>
                <Field label="Nome utente">
                  <Input name="email" type="text" required autoComplete="off" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Password" hint="Almeno 8 caratteri.">
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Ruolo">
                  <select
                    name="role"
                    defaultValue="user"
                    className="min-h-11 w-full rounded-md border border-line-strong bg-subtle px-3 py-2 text-sm text-text transition-colors duration-150 outline-none focus:border-accent"
                  >
                    <option value="user">Utente</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </Field>
              </div>

              {error ? (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong disabled:opacity-60"
              >
                {isPending ? "Creazione…" : "Crea utente"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}