"use client";
import { useEffect, useRef, useState } from "react";
import { requestIconSuggestion } from "../lib/request-icon-suggestion";
import { matchObjectIcon } from "../lib/icon-inference";
import type { IconSuggestion } from "../lib/icon-types";
import { IconPicker } from "./icon-picker";
import { OnlineIconOptions } from "./online-icon-choices";

export type IconSuggestionStatus = "idle" | "local" | "loading" | "success" | "choices" | "notfound" | "error" | "manual";

export function useIconSuggestion(initial: string) {
  const [icon, setIcon] = useState<IconSuggestion>({ emoji: initial });
  const [options, setOptions] = useState<IconSuggestion[]>([]);
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
  function cancel() { invalidate(); setOptions([]); setStatus("idle"); }
  useEffect(() => () => {
    generation.current++;
    requestController.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (deadline.current) clearTimeout(deadline.current);
  }, []);
  function reset() {
    invalidate(); manual.current = false; latestName.current = "";
    updateIcon({ emoji: initial }); setOptions([]); setStatus("idle");
  }
  function choose(next: IconSuggestion) {
    invalidate(); manual.current = true; updateIcon(next); setOptions([]); setStatus(next.imageUrl ? "success" : "manual");
  }
  function select(emoji: string) { choose({ emoji }); }
  function change(name: string, onlineOnly = false) {
    invalidate(); latestName.current = name.trim(); setOptions([]);
    if (manual.current && !onlineOnly) { setStatus(latestIcon.current.imageUrl ? "success" : "manual"); return; }
    const local = matchObjectIcon(name);
    if (!onlineOnly) updateIcon({ emoji: local ?? initial });
    if (!latestName.current || latestName.current.length > 80) { setStatus("idle"); return; }
    if (local && !onlineOnly) { setStatus("local"); return; }
    const request = generation.current;
    setStatus("loading");
    timer.current = setTimeout(() => {
      deadline.current = setTimeout(() => {
        if (generation.current === request) { invalidate(); setStatus("error"); }
      }, 15000);
      const controller = new AbortController();
      requestController.current = controller;
      requestIconSuggestion(name.trim(), controller.signal, onlineOnly).then((result) => {
        if (generation.current !== request) return;
        if (deadline.current) clearTimeout(deadline.current);
        // An online icon is a proposal: only an explicit choice submits it.
        const choices = (result.options ?? []).filter((option) => option.imageUrl && option.photoTitle).slice(0, 2);
        setOptions(choices); setStatus(choices.length ? "choices" : "notfound");
      }).catch(() => {
        if (generation.current !== request) return;
        if (deadline.current) clearTimeout(deadline.current);
        setStatus("error");
      });
    }, 700);
  }
  function retry() { change(latestName.current, true); }
  function imageFailed(expectedImageUrl: string) {
    if (latestIcon.current.imageUrl !== expectedImageUrl) return;
    const emoji = latestIcon.current.emoji;
    invalidate(); updateIcon({ emoji }); setStatus("error");
  }
  return { icon, options, status, reset, cancel, select, choose, change, retry, imageFailed };
}

export function IconSuggestionField({ icon, options = [], status, onSelect, onChoose, onRetry, onImageError }: {
  icon: IconSuggestion;
  options?: IconSuggestion[];
  status: IconSuggestionStatus;
  onSelect: (emoji: string) => void;
  onChoose?: (icon: IconSuggestion) => void;
  onRetry: () => void;
  onImageError: (imageUrl: string) => void;
}) {
  const message = {
    idle: "", local: "Icona trovata nel set offline.",
    loading: "Cerco icone online… Puoi scegliere un’icona a mano.",
    success: "Icona online scelta da te.", choices: "Scegli una delle icone online proposte.",
    notfound: "Nessuna icona online trovata. Puoi scegliere un’icona a mano.",
    error: "Ricerca non disponibile. Puoi scegliere un’icona a mano.", manual: "Icona scelta da te.",
  }[status];
  return <div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-text-2">Icona</span>
      <IconPicker value={icon.emoji} onChange={onSelect} imageUrl={icon.imageUrl} onImageError={onImageError} />
      <input type="hidden" name="photoTitle" value={icon.photoTitle ?? ""} />
    </div>
    <div role="status" aria-live="polite" className="mt-2 text-xs text-text-3">{message}
      {status === "loading" ? <IconSearchProgress /> : null}
    </div>
    {onChoose ? <OnlineIconOptions options={options} onSelect={onChoose} /> : null}
    {status !== "idle" && status !== "loading" ? <button type="button" onClick={onRetry} className="mt-2 min-h-9 text-xs font-semibold text-accent underline">Cerca icone online</button> : null}
    {icon.imageUrl && icon.sourceUrl ? <a href={icon.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-text-3 underline">Icona: {icon.attribution}</a> : null}
  </div>;
}

export function IconSearchProgress() {
  return <div role="progressbar" aria-label="Ricerca icone" className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-soft"><div className="h-full w-1/2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" /></div>;
}
