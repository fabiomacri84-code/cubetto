"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { iconPath, normalizeEmoji } from "../lib/icon-db.generated";

type IconEntry = {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
};

let iconsCache: IconEntry[] | null = null;
let iconsPromise: Promise<IconEntry[]> | null = null;

function loadIcons(): Promise<IconEntry[]> {
  if (iconsCache) return Promise.resolve(iconsCache);
  if (!iconsPromise) {
    iconsPromise = fetch("/icons.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: IconEntry[]) => {
        iconsCache = data;
        return data;
      });
  }
  return iconsPromise;
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function IconGrid({
  value,
  onSelect,
  autoFocus = false,
}: {
  value: string;
  onSelect: (emoji: string) => void;
  autoFocus?: boolean;
}) {
  const [icons, setIcons] = useState<IconEntry[] | null>(iconsCache);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadIcons().then(setIcons).catch(() => setIcons([]));
  }, []);

  const filtered = useMemo(() => {
    if (!icons) return [];
    const term = stripAccents(query.trim().toLowerCase());
    if (!term) return icons;
    return icons.filter((icon) =>
      [
        stripAccents(icon.name.toLowerCase()),
        ...icon.keywords.map((k) => stripAccents(k.toLowerCase())),
        icon.emoji,
      ].some((text) => text.includes(term))
    );
  }, [icons, query]);

  const groups = useMemo(() => {
    const map = new Map<string, IconEntry[]>();
    for (const icon of filtered) {
      const list = map.get(icon.category) ?? [];
      list.push(icon);
      map.set(icon.category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  if (!icons) {
    return (
      <p className="px-1 py-4 text-center text-xs text-text-3">
        Caricamento icone…
      </p>
    );
  }

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca icona…"
        autoFocus={autoFocus}
        className="h-10 w-full rounded-md border border-line-strong bg-subtle px-3 text-base text-text outline-none placeholder:text-text-3 focus:border-accent"
      />
      <div className="mt-2 max-h-64 overflow-y-auto pr-1">
        {groups.length === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-text-3">
            Nessuna icona trovata
          </p>
        ) : (
          groups.map(([category, categoryIcons]) => (
            <div key={category} className="mb-2">
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-3">
                {category}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {categoryIcons.map((icon) => (
                  <button
                    key={icon.emoji}
                    type="button"
                    onClick={() => onSelect(icon.emoji)}
                    title={icon.name}
                    aria-label={icon.name}
                    className={`flex h-10 w-10 items-center justify-center rounded transition-colors hover:bg-surface-2 ${
                      normalizeEmoji(icon.emoji) === normalizeEmoji(value)
                        ? "bg-accent-soft ring-1 ring-accent"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconPath(icon.emoji)}
                      alt=""
                      className="h-6 w-6"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

type Position = {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
};

export function IconPicker({
  name = "emoji",
  initial = "📦",
}: {
  name?: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);
  const autoFocus =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: fine)").matches ?? true);

  useEffect(() => {
    if (!open) return;

    const onScroll = (event: Event) => {
      const picker = pickerRef.current;
      if (picker && event.target instanceof Node && picker.contains(event.target)) {
        return;
      }
      // Su iOS l'apertura della tastiera fa scorrere la pagina subito dopo
      // l'apertura: ignora lo scroll iniziale per non chiudere il selettore.
      if (Date.now() - openedAt.current < 250) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    const el = triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 16);
      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - width - 8),
      );
      const openAbove = rect.top - 8 > 360;

      setPos({
        left,
        width,
        top: openAbove ? undefined : rect.bottom + 8,
        bottom: openAbove ? window.innerHeight - rect.top + 8 : undefined,
      });
    }

    openedAt.current = Date.now();
    setOpen(true);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={normalizeEmoji(value)} />
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-subtle text-xl transition-colors hover:border-accent"
        aria-label="Scegli icona"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconPath(value)} alt="" className="h-6 w-6" />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={pickerRef}
              className="fixed z-[60] rounded-lg border border-line bg-elevated p-3 shadow-lg"
              style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}
              role="dialog"
              aria-label="Scegli icona"
            >
              <IconGrid
                value={value}
                onSelect={(emoji) => {
                  setValue(emoji);
                  setOpen(false);
                }}
                autoFocus={autoFocus}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}