import type { IconSuggestion } from "./icon-types";

export async function requestIconSuggestion(name: string, signal: AbortSignal): Promise<IconSuggestion> {
  const response = await fetch("/api/icon-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Immagine non disponibile.");
  return response.json();
}
