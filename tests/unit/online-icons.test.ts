import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { matchObjectIcon } from "../../app/lib/icon-inference";
vi.mock("../../app/lib/icon-search-terms",()=>({relatedIconQueries:vi.fn(async()=>[])}));
beforeEach(()=>vi.resetModules());afterEach(()=>vi.unstubAllGlobals());
const collections = {
 mdi:{author:{name:"Pictogrammers"},license:{spdx:"Apache-2.0"}},
 "thesvg-color":{author:{name:"The SVG"},license:{spdx:"MIT"}},
 photo:{author:{name:"Photo agency"},license:{spdx:"Proprietary"}},
};
function mockCatalog(search: string[] = [], available: Record<string,string[]> = {}, metadata: object = collections) {
 const fetch=vi.fn(async(url:URL)=>({ok:true,json:async()=>{
  if(url.pathname==="/collections") return metadata;
  if(url.pathname==="/search") return {icons:search};
  const prefix=url.pathname.slice(1).replace(/\.json$/, "");
  const name=url.searchParams.get("icons")!;
  return {icons:available[prefix]?.includes(name)?{[name]:{body:"<path />"}}:{}};
 }}));
 vi.stubGlobal("fetch",fetch);return fetch;
}
it("finds glasses from the actual offline catalog",()=>{
 expect(matchObjectIcon("occhiali")).toBe("👓");expect(matchObjectIcon("Occhiali da sole")).toBe("🕶");
});
it("suggests at most two validated icons, never photos",async()=>{
 const fetch=mockCatalog(["lucide:glasses","fluent-emoji-flat:glasses","photo:glasses"],{lucide:["glasses"],"fluent-emoji-flat":["glasses"]});
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 const icons=await findOnlineIcons("occhiali");expect(icons).toHaveLength(2);
 expect(icons[0].photoTitle).toBe("Iconify:lucide:glasses");expect(icons[0].imageUrl).toBe("https://api.iconify.design/lucide/glasses.svg");
 const search=fetch.mock.calls.find(([url])=>url.pathname==="/search")![0];
 expect(search.searchParams.get("query")).toBe("glasses");expect(search.searchParams.has("prefixes")).toBe(false);
});
it("rejects unknown licenses, malformed identities and nonexistent icons",async()=>{
 const fetch=mockCatalog();
 const {resolveOnlineIcon}=await import("../../app/lib/online-icons");
 expect(await resolveOnlineIcon("Iconify:evil:a")).toBeNull();
 expect(await resolveOnlineIcon("Iconify:constructor:a")).toBeNull();
 expect(await resolveOnlineIcon("Iconify:photo:person")).toBeNull();
 expect(await resolveOnlineIcon("Iconify:mdi:../secret")).toBeNull();
 expect(fetch.mock.calls.every(([url])=>url.pathname==="/collections")).toBe(true);
 expect(await resolveOnlineIcon("Iconify:lucide:unknown")).toBeNull();
});
it.each(["Pepsi", "coca cola", "Coca-Cola", "cocacola", "Nike"])("resolves the exact %s logo using its derived identity", async (name) => {
 const slug=name.toLowerCase().replace(/[ -]/g,"");
 const fetch=mockCatalog([],{"simple-icons":[slug]});
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 const icons=await findOnlineIcons(name);
 expect(icons).toHaveLength(1);
 expect(icons[0]).toMatchObject({photoTitle:`Iconify:simple-icons:${slug}`,imageUrl:`https://api.iconify.design/simple-icons/${slug}.svg`,attribution:"Simple Icons Collaborators · CC0-1.0"});
 expect(fetch).toHaveBeenCalledTimes(1);
});
it("searches a licensed collection outside the original three and preserves attribution",async()=>{
 const fetch=mockCatalog(["mdi:soap"],{mdi:["soap"]});
 const {findOnlineIcons,resolveOnlineIcon}=await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("sapone")).toMatchObject([{photoTitle:"Iconify:mdi:soap",attribution:"Pictogrammers · Apache-2.0"}]);
 expect(await resolveOnlineIcon("Iconify:mdi:soap")).toMatchObject({photoTitle:"Iconify:mdi:soap"});
 expect(fetch.mock.calls.filter(([url])=>url.pathname==="/collections")).toHaveLength(1);
});
it("validates a newly approved collection when manually saving an icon",async()=>{
 mockCatalog([],{mdi:["soap"]});
 const {resolveOnlineIcon}=await import("../../app/lib/online-icons");
 expect(await resolveOnlineIcon("Iconify:mdi:soap")).toMatchObject({photoTitle:"Iconify:mdi:soap"});
});
it("prefers the exact Fanta logo and never confuses it with fantasy",async()=>{
 mockCatalog(["mdi:fantasy","thesvg-color:fanta"],{"thesvg-color":["fanta"],mdi:["fantasy"]});
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("fanta")).toMatchObject([{photoTitle:"Iconify:thesvg-color:fanta"}]);
});
it("does not return unrelated partial matches when no exact icon exists",async()=>{
 mockCatalog(["mdi:fantasy"],{mdi:["fantasy"]});
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("fanta")).toEqual([]);
});
it("keeps known free catalogs usable when collection metadata is unavailable",async()=>{
 const fetch=mockCatalog(["lucide:glasses"],{lucide:["glasses"]});
 fetch.mockImplementation(async(url:URL)=>({ok:url.pathname!=="/collections",json:async()=>url.pathname==="/search"?{icons:["lucide:glasses"]}:{icons:url.pathname==="/lucide.json"?{glasses:{body:"<path />"}}:{}}}));
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("occhiali")).toHaveLength(1);
});
it("searches inferred related objects only after the exact global lookup is empty",async()=>{
 const {relatedIconQueries}=await import("../../app/lib/icon-search-terms");
 vi.mocked(relatedIconQueries).mockResolvedValueOnce(["soda"]);
 const fetch=mockCatalog();
 fetch.mockImplementation(async(url:URL)=>({ok:true,json:async()=>url.pathname==="/collections"?collections:url.pathname==="/search"?{icons:url.searchParams.get("query")==="soda"?["mdi:cup-soda"]:[]}:{icons:url.pathname==="/mdi.json"?{"cup-soda":{body:"<path />"}}:{}}}));
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("chinotto")).toMatchObject([{photoTitle:"Iconify:mdi:cup-soda"}]);
});
it.each([
 ["sapone per le mani", "soap"], ["Shampoo delicato", "lotion bottle"],
 ["caffè macinato", "hot beverage"], ["spazzolini da viaggio", "toothbrush"],
 ["occhiali da sole graduati", "sunglasses"], ["carota", "carrot"],
 ["insaponato", "insaponato"],
])("translates the useful catalog object in %s to %s", async (name, query) => {
 const fetch=mockCatalog();
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 await findOnlineIcons(name);
 expect(fetch.mock.calls.find(([url])=>url.pathname==="/search")![0].searchParams.get("query")).toBe(query);
});
