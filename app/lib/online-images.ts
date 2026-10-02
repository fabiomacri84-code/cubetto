import "server-only";
import type { IconSuggestion } from "./icon-types";

type Meta = { value?: string };
type WikiPage = {
  title?: string;
  pageimage?: string;
  terms?: { description?: string[] };
  imageinfo?: { thumburl?: string; url?: string; extmetadata?: Record<string, Meta> }[];
};
const cache = new Map<string, { until: number; value: IconSuggestion | null }>();
const inflight = new Map<string, Promise<IconSuggestion | null>>();
const TTL = 60 * 60 * 1000;
function plain(value?: string): string {
  return (value ?? "").replace(/<[^>]*>/g, "").replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:amp|#38);/g, "&").replace(/&(?:lt|gt|#\d+);/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
}
export function validPhotoTitle(title: unknown): title is string {
  return typeof title === "string" && title.length <= 240 && /^File:[^\x00-\x1f|#<>]+\.(?:jpe?g|png|webp)$/i.test(title);
}
function trustedImage(url?: string): boolean {
  try { const parsed = new URL(url ?? ""); return parsed.protocol === "https:" && ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(parsed.hostname) && !parsed.username && !parsed.password; } catch { return false; }
}
async function wiki(host: string, params: Record<string, string>, budget?: AbortSignal): Promise<WikiPage[]> {
  const url = new URL(`https://${host}/w/api.php`);
  for (const [key, value] of Object.entries({ action: "query", format: "json", formatversion: "2", ...params })) url.searchParams.set(key, value);
  const response = await fetch(url, { cache: "no-store", signal: budget ? AbortSignal.any([budget, AbortSignal.timeout(3000)]) : AbortSignal.timeout(4000), headers: { "User-Agent": "Cubetto/1.0 (https://github.com/fabiomacri84-code/cubetto)" } });
  if (!response.ok) return [];
  const result = await response.json();
  return Array.isArray(result.query?.pages) ? result.query.pages : [];
}
async function cached(key: string, fetcher: () => Promise<IconSuggestion | null>): Promise<IconSuggestion | null> {
  const entry = cache.get(key);
  if (entry && entry.until > Date.now()) return entry.value;
  if (inflight.has(key)) return inflight.get(key)!;
  if (inflight.size >= 20) return null;
  const promise = fetcher().catch(() => null).then((value) => {
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(key, { until: Date.now() + (value ? TTL : 60_000), value });
    return value;
  }).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
export async function resolveSelectedImage(title: string, budget?: AbortSignal): Promise<IconSuggestion | null> {
  if (!validPhotoTitle(title)) return null;
  return cached(`file:${title}`, async () => {
    const [page] = await wiki("commons.wikimedia.org", { titles: title, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "320" }, budget);
    const info = page?.imageinfo?.[0];
    const meta = info?.extmetadata;
    const license = plain(meta?.LicenseShortName?.value);
    // Reject non-free, non-commercial and unknown licenses.
    if (!/^(?:CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain|PD)$/i.test(license)) return null;
    const imageUrl = info?.thumburl ?? info?.url;
    if (!trustedImage(imageUrl)) return null;
    const author = plain(meta?.Artist?.value);
    return { emoji: "🏙️", photoTitle: title, imageUrl, attribution: `${author || "Wikimedia Commons"} · ${license}`, sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}` };
  });
}
/** Every valid name gets an online attempt, including objects and brands. */
export async function findImage(name: string): Promise<IconSuggestion | null> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80 || /[\x00-\x1f|#<>]/.test(trimmed)) return null;
  return cached(`name:${trimmed.toLocaleLowerCase("it")}`, async () => {
    // One deadline spans all fallbacks; never multiply request timeouts per result.
    const budget = AbortSignal.timeout(8000);
    const query = (host: string, params: Record<string, string>) =>
      wiki(host, params, budget).catch(() => []);
    const imageParams = { prop: "pageimages", piprop: "name", pilicense: "free" };
    const [italian, english] = await Promise.all([
      query("it.wikipedia.org", { ...imageParams, titles: trimmed, redirects: "1" }),
      query("en.wikipedia.org", { ...imageParams, titles: trimmed, redirects: "1" }),
    ]);
    const seen = new Set<string>();
    let attempts = 0;
    const firstFreeImage = async (titles: string[]): Promise<IconSuggestion | null> => {
      for (const title of titles) {
        if (budget.aborted || attempts >= 4) break;
        if (!validPhotoTitle(title) || seen.has(title)) continue;
        seen.add(title);
        attempts++;
        const image = await resolveSelectedImage(title, budget).catch(() => null);
        if (image) return image;
      }
      return null;
    };
    const pageTitles = (pages: WikiPage[]) => pages.flatMap((page) => page.pageimage ? [`File:${page.pageimage}`] : []);
    let image = await firstFreeImage(pageTitles([...italian, ...english]));
    if (image || budget.aborted) return image;
    // Redirects cover plural/object names; full text also covers titles differing
    // from the user's label. Commons finally covers files without a wiki article.
    const related = await query("it.wikipedia.org", {
      ...imageParams, generator: "search", gsrsearch: trimmed, gsrnamespace: "0", gsrlimit: "2",
    });
    image = await firstFreeImage(pageTitles(related));
    if (image || budget.aborted || attempts >= 4) return image;
    const files = await query("commons.wikimedia.org", {
      generator: "search", gsrsearch: `${trimmed} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "3",
    });
    return firstFreeImage(files.flatMap((page) => page.title ? [page.title] : []));
  });
}

// Kept for callers imported before the general image lookup was introduced.
export const findPlaceImage = findImage;
