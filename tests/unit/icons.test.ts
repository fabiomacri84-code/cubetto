import { afterEach, describe, expect, it, vi } from "vitest";
import { matchObjectIcon } from "../../app/lib/icon-inference";
import { findPlaceImage, resolveSelectedImage, validPhotoTitle } from "../../app/lib/online-images";

afterEach(() => vi.unstubAllGlobals());
describe("local icon inference", () => {
  it("matches whole words, accents, plurals and longest phrases", () => {
    expect(matchObjectIcon("Due CAROTE fresche")).toBe("🥕");
    expect(matchObjectIcon("Caffe macinato")).toBe("☕");
    expect(matchObjectIcon("burro di arachidi")).toBe("🥜");
    expect(matchObjectIcon("Spazzolino da denti")).toBe("🪥");
    expect(matchObjectIcon("Verona")).toBeNull();
    expect(matchObjectIcon("salerno")).toBeNull();
    expect(matchObjectIcon("Latteo")).toBeNull();
  });
});
const metadata = (url: string, license: string) => ({ query: { pages: [{ imageinfo: [{ thumburl: url, extmetadata: { Artist: { value: '<a href="javascript:alert(1)">Autore</a>' }, LicenseShortName: { value: license } } }] }] } });
describe("Wikimedia photos", () => {
  it("validates filenames before any fetch", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(validPhotoTitle("File:Verona.jpg")).toBe(true);
    expect(await resolveSelectedImage("https://example.com/a.jpg")).toBeNull();
    expect(await resolveSelectedImage("File:Verona.svg")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("retains free license and sanitized attribution from trusted Commons", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => metadata("https://thumb.wikimedia.org/test.jpg", "CC BY-SA 4.0") }));
    expect(await resolveSelectedImage("File:UnitFree.jpg")).toEqual({ emoji: "🏙️", photoTitle: "File:UnitFree.jpg", imageUrl: "https://thumb.wikimedia.org/test.jpg", attribution: "Autore · CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File%3AUnitFree.jpg" });
  });
  it("rejects non-commercial licenses and untrusted image hosts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => metadata("https://upload.wikimedia.org/test.jpg", "CC BY-NC 4.0") }));
    expect(await resolveSelectedImage("File:UnitRestricted.jpg")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => metadata("https://evil.example/test.jpg", "CC BY 4.0") }));
    expect(await resolveSelectedImage("File:UnitHost.jpg")).toBeNull();
  });
  it("accepts images for articles beyond places", async () => {
    const fetch = vi.fn().mockImplementation(async (url: URL) => ({ ok: true, json: async () => url.hostname === "commons.wikimedia.org"
      ? metadata("https://upload.wikimedia.org/movie.jpg", "CC BY 4.0")
      : { query: { pages: [{ terms: { description: ["film del 2010"] }, pageimage: "Movie.jpg" }] } } }));
    vi.stubGlobal("fetch", fetch);
    expect(await findPlaceImage("Un film sconosciuto")).toMatchObject({ photoTitle: "File:Movie.jpg" });
  });
  it("fails gracefully when Wikimedia is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await findPlaceImage("Una città offline")).toBeNull();
  });
});
