import type { IconSuggestion } from "./icon-types";

export async function requestIconSuggestion(name: string, signal: AbortSignal, onlineOnly = false): Promise<IconSuggestion> {
  const response = await fetch("/api/icon-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...(onlineOnly ? { onlineOnly: true } : {}) }),
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Icone non disponibili.");
  return response.json();
}
