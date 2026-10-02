"use client";
import { useEffect, useRef, useState } from "react";
import { requestIconSuggestion } from "../lib/request-icon-suggestion";
import { matchObjectIcon } from "../lib/icon-inference";
import type { IconSuggestion } from "../lib/icon-types";
import { IconPicker } from "./icon-picker";

export type IconSuggestionStatus = "idle" | "loading" | "success" | "notfound" | "error" | "manual";

export function useIconSuggestion(initial: string) {
  const [icon, setIcon] = useState<IconSuggestion>({ emoji: initial });
  const [status, setStatus] = useState<IconSuggestionStatus>("idle");
  const latestIcon = useRef<IconSuggestion>({ emoji: initial });
  function updateIcon(next: IconSuggestion) { latestIcon.current = next; setIcon(next); }
  const generation = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const manual = useRef(false);
  const latestName = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);
  function invalidate() {
    generation.current++;
    requestController.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (deadline.current) clearTimeout(deadline.current);
  }
  function cancel() { invalidate(); setStatus("idle"); }
  useEffect(() => () => {
    generation.current++;
    requestController.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (deadline.current) clearTimeout(deadline.current);
  }, []);
  function reset() {
    invalidate(); manual.current = false; latestName.current = "";
    updateIcon({ emoji: initial }); setStatus("idle");
  }
  function select(emoji: string) {
    invalidate(); manual.current = true; setIcon({ emoji }); setStatus("manual");
  }
  function change(name: string) {
    invalidate(); latestName.current = name.trim();
    if (manual.current) return;
    const fallback = matchObjectIcon(name) ?? initial;
    updateIcon({ emoji: fallback });
    if (!latestName.current || latestName.current.length > 80) { setStatus("idle"); return; }
    const request = generation.current;
    setStatus("loading");
    timer.current = setTimeout(() => {
      // An unavailable server must never leave the interface waiting indefinitely.
      deadline.current = setTimeout(() => {
        if (generation.current === request) { invalidate(); setStatus("error"); }
      }, 15000);
      const controller = new AbortController();
      requestController.current = controller;
      requestIconSuggestion(name.trim(), controller.signal).then((result) => {
        if (generation.current !== request || manual.current) return;
        if (deadline.current) clearTimeout(deadline.current);
        updateIcon(result.emoji === "📦" && !result.imageUrl ? { emoji: fallback } : result);
        setStatus(result.imageUrl ? "success" : "notfound");
      }).catch(() => {
        if (generation.current !== request || manual.current) return;
        if (deadline.current) clearTimeout(deadline.current);
        setStatus("error");
      });
    }, 700);
  }
  function retry() { manual.current = false; change(latestName.current); }
  function imageFailed(expectedImageUrl: string) {
    if (manual.current || latestIcon.current.imageUrl !== expectedImageUrl) return;
    const emoji = latestIcon.current.emoji;
    invalidate(); updateIcon({ emoji }); setStatus("error");
  }
  return { icon, status, reset, cancel, select, change, retry, imageFailed };
}

export function IconSuggestionField({ icon, status, onSelect, onRetry, onImageError }: {
  icon: IconSuggestion;
  status: IconSuggestionStatus;
  onSelect: (emoji: string) => void;
  onRetry: () => void;
  onImageError: (imageUrl: string) => void;
}) {
  const message = {
    idle: "",
    loading: "Cerco un’immagine… Puoi scegliere un’icona a mano.",
    success: "Immagine trovata. Puoi cambiarla scegliendo un’icona.",
    notfound: "Nessuna immagine trovata. Puoi scegliere un’icona a mano.",
    error: "Immagine non disponibile. Puoi scegliere un’icona a mano.",
    manual: "Icona scelta da te.",
  }[status];
  return <div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-text-2">Icona</span>
      <IconPicker value={icon.emoji} onChange={onSelect} imageUrl={icon.imageUrl} onImageError={onImageError} />
      <input type="hidden" name="photoTitle" value={icon.photoTitle ?? ""} />
    </div>
    <div role="status" aria-live="polite" className="mt-2 text-xs text-text-3">
      {message}
      {status === "loading" ? <div role="progressbar" aria-label="Ricerca immagine" className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" /></div> : null}
    </div>
    {status === "error" || status === "notfound" || status === "manual" ? <button type="button" onClick={onRetry} className="mt-2 min-h-9 text-xs font-semibold text-accent underline">Riprova immagine automatica</button> : null}
    {icon.imageUrl && icon.sourceUrl ? <a href={icon.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-text-3 underline">Foto: {icon.attribution} · Wikimedia Commons</a> : null}
  </div>;
}
