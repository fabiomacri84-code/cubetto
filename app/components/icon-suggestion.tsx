"use client";
import { useEffect, useRef, useState } from "react";
import { suggestIcon } from "../icon-actions";
import { matchObjectIcon } from "../lib/icon-inference";
import type { IconSuggestion } from "../lib/icon-types";
import { IconPicker } from "./icon-picker";

export function useIconSuggestion(initial: string) {
  const [icon, setIcon] = useState<IconSuggestion>({ emoji: initial });
  const generation = useRef(0);
  const manual = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancel() {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
  }
  useEffect(() => () => { generation.current++; if (timer.current) clearTimeout(timer.current); }, []);
  function reset() { cancel(); manual.current = false; setIcon({ emoji: initial }); }
  function select(emoji: string) { cancel(); manual.current = true; setIcon({ emoji }); }
  function change(name: string) {
    cancel();
    if (manual.current) return;
    const local = matchObjectIcon(name);
    setIcon({ emoji: local ?? initial });
    if (local || name.trim().length < 3) return;
    const request = generation.current;
    timer.current = setTimeout(() => {
      suggestIcon(name).then((result) => {
        if (generation.current === request && !manual.current) {
          setIcon(result.emoji === "📦" && !result.imageUrl ? { emoji: initial } : result);
        }
      }).catch(() => {});
    }, 700);
  }
  return { icon, reset, cancel, select, change };
}

export function IconSuggestionField({ icon, onSelect }: { icon: IconSuggestion; onSelect: (emoji: string) => void }) {
  return <div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-text-2">Icona</span>
      <IconPicker value={icon.emoji} onChange={onSelect} imageUrl={icon.imageUrl} />
      <input type="hidden" name="photoTitle" value={icon.photoTitle ?? ""} />
    </div>
    {icon.imageUrl && icon.sourceUrl ? <a href={icon.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-text-3 underline">Foto: {icon.attribution} · Wikimedia Commons</a> : null}
  </div>;
}
