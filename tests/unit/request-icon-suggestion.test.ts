import { afterEach, expect, it, vi } from "vitest";
import { requestIconSuggestion } from "../../app/lib/request-icon-suggestion";
afterEach(() => vi.unstubAllGlobals());
it("uses a cancellable authenticated no-cache read independent of server actions", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ emoji: "🥛" }));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  expect(await requestIconSuggestion("Latte", controller.signal)).toEqual({ emoji: "🥛" });
  expect(fetch).toHaveBeenCalledWith("/api/icon-suggestion", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Latte" }), credentials: "same-origin", cache: "no-store", signal: controller.signal }));
});
it("surfaces endpoint failure to the fallback UI", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
  await expect(requestIconSuggestion("Latte", new AbortController().signal)).rejects.toThrow("Immagine non disponibile");
});
