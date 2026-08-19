"use client";

import { useState } from "react";

const EMOJIS = [
  "🛒", "🧺", "🍎", "🍌", "🥬", "🥛", "🥚", "🧀", "🍞", "🍝", "🍅", "🫒",
  "☕", "🥩", "🐟", "🧻", "🧴", "🧽", "🧼", "🪥", "🦷", "👕", "👖", "🩲",
  "🧦", "🎽", "🩱", "🩳", "🩴", "👟", "🧳", "🎒", "🕶️", "🧢", "💊", "💄",
  "🔌", "🔋", "📱", "🎧", "📷", "📄", "🪪", "💶", "🔑", "🏖️", "💧",
  "🥤", "🍫", "🍪", "🥫", "🍚", "🧂", "🌶️", "🧅", "🥔", "🍋", "🍓", "🍇",
  "🐶", "🐱", "🌱", "🌸", "🧸", "📦",
];

export function EmojiPicker({
  name = "emoji",
  initial = "📦",
}: {
  name?: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-line-strong bg-subtle text-xl transition-colors hover:border-accent"
        aria-label="Scegli emoji"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {value}
      </button>
      {open ? (
        <div className="absolute bottom-12 left-0 z-20 w-72 rounded-lg border border-line bg-elevated p-3 shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setValue(emoji);
                  setOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-surface-2 ${
                  emoji === value ? "bg-accent-soft ring-1 ring-accent" : ""
                }`}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}