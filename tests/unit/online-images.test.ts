import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../app/auth", () => ({ requireUser: vi.fn().mockResolvedValue({ id: "test-user" }) }));

const metadata = (license = "CC BY-SA 4.0", url = "https://upload.wikimedia.org/example.jpg") => ({
  query: { pages: [{ imageinfo: [{ thumburl: url, extmetadata: {
    Artist: { value: "Fotografo" }, LicenseShortName: { value: license },
  } }] }] },
});
const response = (body: unknown) => ({ ok: true, json: async () => body });
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("automatic images for all names", () => {
  it.each(["Irlanda", "Pewex", "Carrefour", "infradito"])("searches online for %s without a place requirement", async (name) => {
    const fetch = vi.fn(async (url: URL) => response(url.hostname === "commons.wikimedia.org"
      ? metadata()
      : { query: { pages: [{ pageimage: `${name}.jpg` }] } }));
    vi.stubGlobal("fetch", fetch);
    const { findImage } = await import("../../app/lib/online-images");
    expect(await findImage(name)).toMatchObject({ photoTitle: `File:${name}.jpg`, attribution: "Fotografo · CC BY-SA 4.0" });
    expect(fetch).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }));
  });

  it("uses a local icon before any online search", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const { suggestIcon } = await import("../../app/icon-actions");
    expect(await suggestIcon("occhiali")).toEqual({ emoji: "👓" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to Commons bitmap search when wiki pages only have SVGs", async () => {
    const fetch = vi.fn(async (url: URL) => {
      if (url.hostname !== "commons.wikimedia.org") return response({ query: { pages: [{ pageimage: "Logo.svg" }] } });
      if (url.searchParams.get("generator") === "search") return response({ query: { pages: [{ title: "File:Shop facade.jpg" }] } });
      return response(metadata());
    });
    vi.stubGlobal("fetch", fetch);
    const { findImage } = await import("../../app/lib/online-images");
    expect(await findImage("Negozio")).toMatchObject({ photoTitle: "File:Shop facade.jpg" });
    const searches = fetch.mock.calls.map(([url]) => url).filter((url) => url.hostname === "commons.wikimedia.org" && url.searchParams.has("gsrsearch"));
    expect(searches[0].searchParams.get("gsrsearch")).toBe("Negozio filetype:bitmap");
    expect(fetch.mock.calls.some(([url]) => url.searchParams.get("titles") === "File:Logo.svg")).toBe(false);
  });

  it("does not select a restricted image and retries a free relevant result", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
      if (url.hostname === "commons.wikimedia.org") return response(metadata(url.searchParams.get("titles") === "File:Restricted.jpg" ? "CC BY-NC 4.0" : "CC0"));
      return response({ query: { pages: [{ pageimage: url.searchParams.has("generator") ? "Free.jpg" : "Restricted.jpg" }] } });
    }));
    const { findImage } = await import("../../app/lib/online-images");
    expect(await findImage("Oggetto")).toMatchObject({ photoTitle: "File:Free.jpg" });
  });

  it("deduplicates concurrent attempts and caches successful metadata", async () => {
    const fetch = vi.fn(async (url: URL) => response(url.hostname === "commons.wikimedia.org" ? metadata() : { query: { pages: [{ pageimage: "Cached.jpg" }] } }));
    vi.stubGlobal("fetch", fetch);
    const { findImage } = await import("../../app/lib/online-images");
    const [first, second] = await Promise.all([findImage("Cuffie"), findImage("cuffie")]);
    expect(first).toEqual(second);
    await findImage("Cuffie");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("bounds candidates and returns null on provider failure for manual fallback", async () => {
    const fetch = vi.fn(async (url: URL) => {
      if (url.searchParams.get("prop") === "imageinfo") return response(metadata("CC BY-NC 4.0"));
      if (url.hostname === "commons.wikimedia.org") return response({ query: { pages: [1, 2, 3].map((index) => ({ title: `File:Restricted${index}.jpg` })) } });
      return response({ query: { pages: [{ pageimage: `${url.hostname}${url.searchParams.has("generator") ? "Search" : "Exact"}.jpg` }] } });
    });
    vi.stubGlobal("fetch", fetch);
    const { findImage } = await import("../../app/lib/online-images");
    expect(await findImage("Senza risultati liberi")).toBeNull();
    expect(fetch.mock.calls.filter(([url]) => url.searchParams.get("prop") === "imageinfo")).toHaveLength(4);
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(8);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await findImage("Senza connessione")).toBeNull();
  });
});
