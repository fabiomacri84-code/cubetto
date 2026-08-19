"use client";

import { useEffect, useMemo, useState } from "react";
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

export function IconPicker({
  name = "emoji",
  initial = "📦",
}: {
  name?: string;
  initial?: string;
}) {
  const [icons, setIcons] = useState<IconEntry[] | null>(iconsCache);
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative">
      <input type="hidden" name={name} value={normalizeEmoji(value)} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-subtle text-xl transition-colors hover:border-accent"
        aria-label="Scegli icona"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconPath(value)} alt="" className="h-6 w-6" />
      </button>
      {open ? (
        <div className="absolute bottom-12 left-0 z-20 w-80 rounded-lg border border-line bg-elevated p-3 shadow-lg">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca icona…"
            className="mb-2 h-9 w-full rounded-md border border-line-strong bg-subtle px-3 text-sm text-text outline-none placeholder:text-text-3 focus:border-accent"
          />
          <div className="max-h-64 overflow-y-auto pr-1">
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
                        onClick={() => {
                          setValue(icon.emoji);
                          setOpen(false);
                          setQuery("");
                        }}
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
        </div>
      ) : null}
    </div>
  );
}