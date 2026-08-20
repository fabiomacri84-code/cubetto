"use client";

import { useEffect } from "react";
import { Button } from "../../components/ui/button";

export default function ListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl" aria-hidden>
        😵
      </span>
      <h1 className="text-lg font-extrabold tracking-tight text-text">
        Ops, la lista non si è aggiornata.
      </h1>
      <p className="max-w-sm text-sm leading-6 text-text-3">
        Un errore ha impedito di caricare questa lista. Riprova: se
        l&apos;elemento è già stato aggiornato, non lo perderai.
      </p>
      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          Riprova
        </Button>
        <Button type="button" variant="secondary" href="/">
          Torna alla home
        </Button>
      </div>
    </main>
  );
}