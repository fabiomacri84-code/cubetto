"use client";

import { useRef, useState } from "react";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { IconPicker } from "./icon-picker";
import { cn } from "./ui/cn";

type ServerAction = (formData: FormData) => Promise<void>;

export function CreateSheet({
  triggerLabel,
  title,
  placeholder,
  iconInitial,
  cta,
  action,
  variant = "fab",
  className,
}: {
  triggerLabel: string;
  title: string;
  placeholder: string;
  iconInitial: string;
  cta: string;
  action: ServerAction;
  variant?: "fab" | "tile" | "inline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function openSheet() {
    setOpen(true);
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className={cn(
          variant === "fab" &&
            "fab inline-flex items-center gap-2 px-6 text-base font-semibold",
          variant === "inline" &&
            "flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-accent-strong",
          variant === "tile" &&
            "card group flex h-full flex-col items-center justify-center gap-1 p-4 text-sm font-semibold text-accent-strong transition-colors hover:bg-accent-soft",
          className,
        )}
      >
        {variant === "fab" ? (
          <span className="text-2xl leading-none" aria-hidden>
            ＋
          </span>
        ) : variant === "tile" ? (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-xl"
            aria-hidden
          >
            ＋
          </span>
        ) : null}
        {triggerLabel}
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
              <h2 className="text-xl font-bold text-text">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-text-2"
              >
                ✕
              </button>
            </div>

            <form action={action} className="mt-3 flex flex-col gap-4 pb-2">
              <Field label="Nome">
                <Input
                  ref={nameRef}
                  name="name"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={placeholder}
                />
              </Field>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-2">Icona</span>
                <IconPicker name="emoji" initial={iconInitial} />
              </div>

              <button
                type="submit"
                className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
              >
                {cta}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}