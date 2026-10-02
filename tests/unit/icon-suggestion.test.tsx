import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { suggest } = vi.hoisted(() => ({ suggest: vi.fn() }));
vi.mock("../../app/icon-actions", () => ({ suggestIcon: suggest }));
import { useIconSuggestion } from "../../app/components/icon-suggestion";
import type { IconSuggestion } from "../../app/lib/icon-types";
let controller: ReturnType<typeof useIconSuggestion>;
let root: Root;
function Harness() {
  const result = useIconSuggestion("📦");
  useEffect(() => { controller = result; });
  return null;
}
beforeEach(() => {
  vi.useFakeTimers(); suggest.mockReset();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.createElement("div"));
  act(() => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });
function pending() {
  let resolve!: (value: IconSuggestion) => void;
  const promise = new Promise<IconSuggestion>((done) => { resolve = done; });
  return { promise, resolve };
}
it("ignores old online results after a new local name", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "🏙️", imageUrl: "https://upload.wikimedia.org/test.jpg" }));
  expect(controller.icon).toEqual({ emoji: "🥛" });
});
it("preserves manual choice during a request and subsequent edits", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.select("🎁"));
  act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "🏙️" }));
  expect(controller.icon).toEqual({ emoji: "🎁" });
});
it("cancels a delayed lookup on close and resets manual override on reopen", () => {
  act(() => controller.change("Verona"));
  act(() => controller.cancel());
  act(() => vi.advanceTimersByTime(1000));
  expect(suggest).not.toHaveBeenCalled();
  act(() => controller.select("🎁"));
  act(() => controller.reset());
  act(() => controller.change("Latte"));
  expect(controller.icon).toEqual({ emoji: "🥛" });
});
it("invalidates requests on clear and reopen", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.change(""));
  act(() => controller.reset());
  await act(async () => old.resolve({ emoji: "🏙️" }));
  expect(controller.icon).toEqual({ emoji: "📦" });
});
