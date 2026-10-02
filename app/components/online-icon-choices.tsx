"use client";
import { useEffect, useRef, useState } from "react";
import type { IconSuggestion } from "../lib/icon-types";
import { requestIconSuggestion } from "../lib/request-icon-suggestion";

export function OnlineIconOptions({ options, onSelect }: { options: IconSuggestion[]; onSelect: (icon: IconSuggestion) => void }) {
  return options.length ? <div className="mt-3 flex flex-wrap gap-3" aria-label="Icone online suggerite">
    {options.slice(0, 2).map((icon, index) => <div key={icon.photoTitle} className="max-w-36">
      <button type="button" aria-label={`Scegli icona online ${index + 1}`} onClick={() => onSelect(icon)} className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border border-border bg-surface p-2 hover:border-accent">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon.imageUrl} alt="" width={48} height={48} referrerPolicy="no-referrer" className="h-12 w-12 object-contain" />
      </button>
      {icon.suggestionNote ? <p className="mt-1 text-xs text-text-3">{icon.suggestionNote}</p> : null}
      {icon.sourceUrl ? <a href={icon.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-text-3 underline">{icon.attribution ?? "Fonte dell’icona"}</a> : null}
    </div>)}
  </div> : null;
}

/** Existing objects always keep their current icon until a proposal is selected. */
export function OnlineIconChoices({ name, onSelect }: { name: string; onSelect: (icon: IconSuggestion) => void }) {
  const [query, setQuery] = useState(name);
  const [options, setOptions] = useState<IconSuggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "choices" | "notfound" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancel() {
    generation.current++; controller.current?.abort();
    if (timer.current) clearTimeout(timer.current);
  }
  useEffect(() => () => { generation.current++; controller.current?.abort(); if (timer.current) clearTimeout(timer.current); }, []);
  async function search() {
    cancel(); setOptions([]);
    if (!query.trim() || query.trim().length > 80) { setStatus("idle"); return; }
    const request = generation.current;
    const abort = new AbortController(); controller.current = abort;
    setStatus("loading");
    timer.current = setTimeout(() => { if (request === generation.current) { cancel(); setStatus("error"); } }, 15000);
    try {
      const result = await requestIconSuggestion(query.trim(), abort.signal, true);
      if (request !== generation.current) return;
      if (timer.current) clearTimeout(timer.current);
      const found = (result.options ?? []).filter((icon) => icon.imageUrl && icon.photoTitle).slice(0, 2);
      setOptions(found); setStatus(found.length ? "choices" : "notfound");
    } catch { if (request === generation.current) { if (timer.current) clearTimeout(timer.current); setStatus("error"); } }
  }
  return <div className="mt-4 border-t border-border pt-3">
    <label className="block text-sm font-semibold text-text-2">Cerca icone online
      <input value={query} maxLength={80} onChange={(event) => { cancel(); setQuery(event.target.value); setOptions([]); setStatus("idle"); }} className="mt-2 w-full rounded-xl border border-border p-3 text-base" />
    </label>
    <button type="button" onClick={search} disabled={!query.trim()} className="mt-2 min-h-10 text-sm font-semibold text-accent underline">{status === "loading" ? "Ripeti ricerca" : "Cerca icone online"}</button>
    <div role="status" aria-live="polite" className="mt-1 text-xs text-text-3">{status === "loading" ? "Cerco icone online… La scelta manuale resta disponibile." : status === "error" ? "Ricerca non disponibile. Puoi riprovare o scegliere un’icona a mano." : status === "notfound" ? "Nessuna icona online trovata. Puoi scegliere un’icona a mano." : status === "choices" ? "Scegli un’icona da applicare." : ""}
      {status === "loading" ? <div role="progressbar" aria-label="Ricerca icone" className="mt-2 h-1.5 rounded-full bg-accent-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-accent" /></div> : null}
    </div>
    <OnlineIconOptions options={options} onSelect={(icon) => { cancel(); setOptions([]); setStatus("idle"); onSelect(icon); }} />
  </div>;
}
