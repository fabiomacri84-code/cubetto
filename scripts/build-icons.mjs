import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ICON_SET } from "./icon-set.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "icons");
const TWEMOJI = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/";
const CONCURRENCY = 16;
const RETRIES = 2;

export function twemojiName(emoji) {
  return [...emoji]
    .filter((ch) => ch !== "\uFE0F")
    .map((ch) => ch.codePointAt(0).toString(16).padStart(4, "0"))
    .join("-");
}

export function normalizeEmoji(emoji) {
  return [...emoji].filter((ch) => ch !== "\uFE0F").join("");
}

async function download(url, dest) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (response.status === 404) return false;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      await writeFile(dest, body);
      return true;
    } catch (error) {
      if (attempt === RETRIES) throw error;
    }
  }
}

async function pool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  });
  await Promise.all(workers);
  return results;
}

await mkdir(ICONS_DIR, { recursive: true });

const seen = new Set();
const entries = [];
for (const entry of ICON_SET) {
  const emoji = normalizeEmoji(entry.emoji);
  if (seen.has(emoji)) {
    console.warn(`⚠️  emoji duplicata nel set: ${entry.emoji}`);
    continue;
  }
  seen.add(emoji);
  entries.push({ ...entry, emoji });
}

const jobs = entries.map((entry) => async () => {
  const name = `${twemojiName(entry.emoji)}.svg`;
  const dest = path.join(ICONS_DIR, name);
  if (existsSync(dest)) return { entry, name, ok: true, cached: true };
  const ok = await download(`${TWEMOJI}${name}`, dest);
  if (!ok) console.warn(`✗ non trovata su Twemoji: ${entry.emoji} (${name})`);
  return { entry, name, ok, cached: false };
});

const results = await pool(jobs, CONCURRENCY);
const downloaded = results.filter((r) => r.ok && !r.cached).length;
const missing = results.filter((r) => !r.ok);
const available = new Set(
  results.filter((r) => r.ok).map((r) => r.entry.emoji)
);

const db = entries
  .filter((entry) => available.has(entry.emoji))
  .map(({ emoji, name, keywords, category }) => ({ emoji, name, keywords, category }));

await writeFile(
  path.join(ROOT, "public", "icons.json"),
  JSON.stringify(db, null, 2)
);

const ts = `// GENERATO da scripts/build-icons.mjs - non modificare a mano
export type IconEntry = {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
};

export const ICONS: IconEntry[] = ${JSON.stringify(db, null, 2)};

const AVAILABLE = new Set<string>(${JSON.stringify([...available])});

export function normalizeEmoji(emoji: string): string {
  return [...emoji].filter((ch) => ch !== "\\uFE0F").join("");
}

export function twemojiName(emoji: string): string {
  return [...emoji]
    .filter((ch) => ch !== "\\uFE0F")
    .map((ch) => ch.codePointAt(0)!.toString(16).padStart(4, "0"))
    .join("-");
}

export function isIconAvailable(emoji: string): boolean {
  return AVAILABLE.has(normalizeEmoji(emoji));
}

export function iconPath(emoji: string): string {
  return \`/icons/\${twemojiName(emoji)}.svg\`;
}
`;

await writeFile(path.join(ROOT, "app", "lib", "icon-db.generated.ts"), ts);

console.log(
  `✓ ${db.length} icone nel database (${downloaded} scaricate, ${results.filter((r) => r.ok && r.cached).length} già presenti, ${missing.length} mancanti)`
);
if (missing.length > 0) {
  console.log(`  mancanti: ${missing.map((m) => m.entry.emoji).join(" ")}`);
}