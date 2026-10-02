import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { suggest } = vi.hoisted(() => ({ suggest: vi.fn() }));
vi.mock("../../app/icon-actions", () => ({ suggestIcon: suggest }));
vi.mock("../../app/components/icon-picker", () => ({ IconPicker: ({ onChange }: { onChange: (emoji: string) => void }) => <button type="button" onClick={() => onChange("🎁")}>Scegli icona</button> }));
import { IconSuggestionField, useIconSuggestion } from "../../app/components/icon-suggestion";
import type { IconSuggestion } from "../../app/lib/icon-types";
let controller: ReturnType<typeof useIconSuggestion>;
let root: Root;
let container: HTMLDivElement;
function Harness() {
  const result = useIconSuggestion("📦");
  useEffect(() => { controller = result; });
  return <IconSuggestionField icon={result.icon} status={result.status} onSelect={result.select} onRetry={result.retry} onImageError={result.imageFailed} />;
}
beforeEach(() => {
  vi.useFakeTimers(); suggest.mockReset();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });
function pending() {
  let resolve!: (value: IconSuggestion) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<IconSuggestion>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
it("attempts images for objects, short names and brands with visible progress", async () => {
  suggest.mockResolvedValue({ emoji: "📦" });
  for (const name of ["Latte", "Io", "Carrefour", "infradito"]) {
    act(() => controller.change(name));
    expect(controller.status).toBe("loading");
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(container.querySelector("button")?.disabled).toBe(false);
    await act(async () => vi.advanceTimersByTime(700));
    expect(suggest).toHaveBeenLastCalledWith(name);
    expect(controller.status).toBe("notfound");
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  }
});
it("ignores old online results after a new object name while trying its image", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ emoji: "🥛" });
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "🏙️", imageUrl: "https://upload.wikimedia.org/test.jpg" }));
  expect(controller.icon).toEqual({ emoji: "🥛" });
  expect(controller.status).toBe("loading");
  await act(async () => vi.advanceTimersByTime(700));
  expect(suggest).toHaveBeenLastCalledWith("Latte");
});
it("preserves manual choice during a request and subsequent edits", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.select("🎁"));
  act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "🏙️" }));
  expect(controller.icon).toEqual({ emoji: "🎁" });
  expect(controller.status).toBe("manual");
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
  expect(controller.status).toBe("loading");
});
it("invalidates requests on clear and reopen", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona"));
  act(() => vi.advanceTimersByTime(700));
  act(() => controller.change(""));
  act(() => controller.reset());
  await act(async () => old.resolve({ emoji: "🏙️" }));
  expect(controller.icon).toEqual({ emoji: "📦" });
  expect(controller.status).toBe("idle");
});
it("offers manual choice and an explicit retry after a failed request", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ emoji: "🏙️", imageUrl: "https://upload.wikimedia.org/photo.jpg", photoTitle: "File:Photo.jpg" });
  act(() => controller.change("Irlanda"));
  act(() => vi.advanceTimersByTime(700));
  await act(async () => old.reject(new Error("offline")));
  expect(controller.status).toBe("error");
  expect(container.textContent).toContain("Puoi scegliere un’icona a mano");
  act(() => container.querySelector("button")?.click());
  expect(controller.icon).toEqual({ emoji: "🎁" });
  act(() => controller.retry());
  await act(async () => vi.advanceTimersByTime(700));
  expect(controller.status).toBe("success");
  expect(controller.icon.photoTitle).toBe("File:Photo.jpg");
});
it("times out and ignores a late reply while keeping the picker usable", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Pewex"));
  act(() => vi.advanceTimersByTime(15700));
  expect(controller.status).toBe("error");
  await act(async () => old.resolve({ emoji: "🏙️", imageUrl: "https://upload.wikimedia.org/photo.jpg" }));
  expect(controller.icon.imageUrl).toBeUndefined();
  act(() => controller.select("🎁"));
  expect(controller.icon.emoji).toBe("🎁");
});
it("clears a broken preview and its submitted photo title", async () => {
  suggest.mockResolvedValue({ emoji: "🏙️", imageUrl: "https://upload.wikimedia.org/photo.jpg", photoTitle: "File:Photo.jpg" });
  act(() => controller.change("Irlanda"));
  await act(async () => vi.advanceTimersByTime(700));
  act(() => controller.imageFailed("https://upload.wikimedia.org/photo.jpg"));
  expect(controller.status).toBe("error");
  expect(controller.icon).toEqual({ emoji: "🏙️" });
  expect(container.querySelector<HTMLInputElement>('input[name="photoTitle"]')?.value).toBe("");
});

it("ignores an old preview failure after choosing manually or changing the name", async () => {
  const imageUrl = "https://upload.wikimedia.org/old.jpg";
  suggest.mockResolvedValueOnce({ emoji: "🏙️", imageUrl }).mockReturnValueOnce(new Promise(() => {}));
  act(() => controller.change("Irlanda"));
  await act(async () => vi.advanceTimersByTime(700));
  const oldFailure = controller.imageFailed;
  act(() => controller.select("🎁"));
  act(() => oldFailure(imageUrl));
  expect(controller.icon).toEqual({ emoji: "🎁" });
  expect(controller.status).toBe("manual");
  act(() => controller.reset());
  act(() => controller.change("Latte"));
  act(() => oldFailure(imageUrl));
  expect(controller.icon).toEqual({ emoji: "🥛" });
  expect(controller.status).toBe("loading");
});
