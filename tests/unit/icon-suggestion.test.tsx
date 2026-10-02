import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { suggest } = vi.hoisted(() => ({ suggest: vi.fn() }));
vi.mock("../../app/lib/request-icon-suggestion", () => ({ requestIconSuggestion: suggest }));
vi.mock("../../app/components/icon-picker", () => ({ IconPicker: ({ onChange }: { onChange: (emoji: string) => void }) => <button type="button" onClick={() => onChange("🎁")}>Scegli icona</button> }));
import { IconSuggestionField, useIconSuggestion } from "../../app/components/icon-suggestion";
import { OnlineIconChoices } from "../../app/components/online-icon-choices";
import type { IconSuggestion } from "../../app/lib/icon-types";
let controller: ReturnType<typeof useIconSuggestion>;
let root: Root;
let container: HTMLDivElement;
const glasses: IconSuggestion = { emoji: "👓", imageUrl: "https://api.iconify.design/mdi/glasses.svg", photoTitle: "Iconify:mdi:glasses", attribution: "Material Design Icons · Apache 2.0", sourceUrl: "https://icon-sets.iconify.design/mdi/glasses/" };
function Harness() {
  const result = useIconSuggestion("📦");
  useEffect(() => { controller = result; });
  return <IconSuggestionField icon={result.icon} options={result.options} status={result.status} onSelect={result.select} onChoose={result.choose} onRetry={result.retry} onImageError={result.imageFailed} />;
}
beforeEach(() => {
  vi.useFakeTimers(); suggest.mockReset();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });
function pending() {
  let resolve!: (value: IconSuggestion) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<IconSuggestion>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
it("uses offline icons first without contacting a provider", async () => {
  for (const name of ["Latte", "occhiali", "infradito"]) {
    act(() => controller.change(name));
    expect(controller.status).toBe("local");
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(suggest).not.toHaveBeenCalled();
  }
});
it("offers online choices for unknown names without silently selecting them", async () => {
  suggest.mockResolvedValue({ emoji: "📦", options: [glasses] });
  act(() => controller.change("Pewex"));
  expect(controller.status).toBe("loading");
  expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
  await act(async () => vi.advanceTimersByTime(700));
  expect(controller.status).toBe("choices");
  expect(controller.icon.photoTitle).toBeUndefined();
  expect(container.querySelector<HTMLInputElement>('input[name="photoTitle"]')?.value).toBe("");
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Scegli icona online 1"]')?.click());
  expect(controller.icon.photoTitle).toBe(glasses.photoTitle);
});
it("explicit online search also works when an offline icon exists", async () => {
  suggest.mockResolvedValue({ emoji: "👓", options: [glasses] });
  act(() => controller.change("occhiali"));
  act(() => controller.retry());
  await act(async () => vi.advanceTimersByTime(700));
  expect(suggest).toHaveBeenCalledWith("occhiali", expect.any(AbortSignal), true);
  expect(controller.icon).toEqual({ emoji: "👓" });
  expect(controller.options).toEqual([glasses]);
});
it("ignores stale online results after switching to an offline object", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Verona")); act(() => vi.advanceTimersByTime(700));
  act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "📦", options: [glasses] }));
  expect(controller.icon).toEqual({ emoji: "🥛" }); expect(controller.status).toBe("local"); expect(controller.options).toEqual([]);
});
it("manual selection cancels requests and survives further name edits", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Pewex")); act(() => vi.advanceTimersByTime(700));
  const signal = suggest.mock.calls[0][1] as AbortSignal;
  act(() => controller.select("🎁")); act(() => controller.change("Latte"));
  await act(async () => old.resolve({ emoji: "📦", options: [glasses] }));
  expect(signal.aborted).toBe(true); expect(controller.icon).toEqual({ emoji: "🎁" }); expect(controller.status).toBe("manual");
});
it("cancels on close and restores offline inference on reopen", () => {
  act(() => controller.change("Verona")); act(() => controller.cancel()); act(() => vi.advanceTimersByTime(1000));
  expect(suggest).not.toHaveBeenCalled();
  act(() => controller.select("🎁")); act(() => controller.reset()); act(() => controller.change("Latte"));
  expect(controller.icon).toEqual({ emoji: "🥛" }); expect(controller.status).toBe("local");
});
it("offers manual choice after failure and permits explicit retry", async () => {
  suggest.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ emoji: "📦", options: [glasses] });
  act(() => controller.change("Irlanda")); await act(async () => vi.advanceTimersByTime(700));
  expect(controller.status).toBe("error"); expect(container.textContent).toContain("Puoi scegliere un’icona a mano");
  act(() => controller.select("🎁")); act(() => controller.retry()); await act(async () => vi.advanceTimersByTime(700));
  expect(controller.status).toBe("choices"); expect(controller.icon.emoji).toBe("🎁");
});
it("times out safely and rejects late proposals", async () => {
  const old = pending(); suggest.mockReturnValueOnce(old.promise);
  act(() => controller.change("Pewex")); act(() => vi.advanceTimersByTime(15700));
  expect(controller.status).toBe("error");
  await act(async () => old.resolve({ emoji: "📦", options: [glasses] }));
  expect(controller.options).toEqual([]); act(() => controller.select("🎁")); expect(controller.icon.emoji).toBe("🎁");
});
it("clears a broken selected preview and prevents submitting its identifier", () => {
  act(() => controller.choose(glasses)); act(() => controller.imageFailed(glasses.imageUrl!));
  expect(controller.status).toBe("error"); expect(controller.icon).toEqual({ emoji: "👓" });
  expect(container.querySelector<HTMLInputElement>('input[name="photoTitle"]')?.value).toBe("");
});
it("existing object search keeps current icon until choosing a proposal", async () => {
  const selected = vi.fn(); suggest.mockResolvedValue({ emoji: "👓", options: [glasses] });
  act(() => root.render(<OnlineIconChoices name="occhiali" onSelect={selected} />));
  await act(async () => container.querySelector<HTMLButtonElement>("button")?.click());
  expect(suggest).toHaveBeenCalledWith("occhiali", expect.any(AbortSignal), true);
  expect(selected).not.toHaveBeenCalled();
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="Scegli icona online 1"]')?.click());
  expect(selected).toHaveBeenCalledWith(glasses);
});
