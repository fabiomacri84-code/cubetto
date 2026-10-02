import "server-only";
import type { IconSuggestion } from "./icon-types";

// Only icon collections with explicit free licenses, never stock/photo searches.
const sets: Record<string, { author: string; license: string }> = {
  "fluent-emoji-flat": { author: "Microsoft", license: "MIT" },
  "lucide": { author: "Lucide Contributors", license: "ISC" },
};
const translations: Record<string,string> = { occhiali: "glasses", "occhiali da sole": "sunglasses", infradito: "thong sandal", tagliaunghie: "nail clipper", cacciavite: "screwdriver", pinza: "pliers", borraccia: "water bottle", aspirapolvere: "vacuum", caricabatterie: "charger", chiave: "key", casco: "helmet", candela: "candle", scotch: "tape", detersivo: "detergent", spugna: "sponge", forbici: "scissors", irlanda: "ireland" };
const cache = new Map<string,{until:number;value:IconSuggestion[]}>();
const pending = new Map<string,Promise<IconSuggestion[]>>();
const validated = new Map<string,{until:number;value:IconSuggestion}>();
function identity(title: string) {
  const match = /^Iconify:([a-z0-9-]+):([a-z0-9-]+)$/.exec(title);
  return match && sets[match[1]] ? { prefix:match[1],name:match[2] } : null;
}
async function api(url: URL, signal?: AbortSignal) {
  const response = await fetch(url, { cache:"no-store", signal:signal ?? AbortSignal.timeout(5000) });
  if(!response.ok) throw new Error("Catalogo icone non disponibile.");
  return response.json();
}
export async function resolveOnlineIcon(title:string, signal?:AbortSignal):Promise<IconSuggestion|null> {
  const id=identity(title); if(!id) return null;
  const previous=validated.get(title); if(previous && previous.until>Date.now()) return previous.value;
  try {
    const url=new URL(`https://api.iconify.design/${id.prefix}.json`);url.searchParams.set("icons",id.name);
    const data=await api(url,signal);
    if(!data.icons?.[id.name] || typeof data.icons[id.name].body!=="string") return null;
    const metadata=sets[id.prefix];
    const value={emoji:"📦",photoTitle:title,imageUrl:`https://api.iconify.design/${id.prefix}/${id.name}.svg`,attribution:`${metadata.author} · ${metadata.license}`,sourceUrl:`https://icon-sets.iconify.design/${id.prefix}/${id.name}/`};
    if(validated.size>=256) validated.delete(validated.keys().next().value!);
    validated.set(title,{until:Date.now()+3600000,value});return value;
  } catch { return null; }
}
export async function findOnlineIcons(name:string):Promise<IconSuggestion[]> {
  const key=name.trim().toLowerCase(); if(!key || key.length>80) return [];
  const existing=cache.get(key); if(existing && existing.until>Date.now()) return existing.value;
  if(pending.has(key)) return pending.get(key)!;
  if(pending.size>=10) return [];
  const work=(async()=>{
    const signal=AbortSignal.timeout(8000);
    const query=translations[key] ?? key;
    const url=new URL("https://api.iconify.design/search");
    url.searchParams.set("query",query);url.searchParams.set("prefixes",Object.keys(sets).join(","));url.searchParams.set("limit","8");
    const data=await api(url,signal);
    const titles: string[] = Array.isArray(data.icons) ? data.icons.filter((id:unknown):id is string=>typeof id==="string" && !!identity(`Iconify:${id}`)).slice(0,4) : [];
    const result:IconSuggestion[]=[];
    for(const id of titles) { const icon=await resolveOnlineIcon(`Iconify:${id}`,signal);if(icon) result.push(icon);if(result.length===2 || signal.aborted) break; }
    if(cache.size>=256) cache.delete(cache.keys().next().value!);
    cache.set(key,{until:Date.now()+(result.length?3600000:10000),value:result});return result;
  })().finally(()=>pending.delete(key));
  pending.set(key,work);return work;
}
