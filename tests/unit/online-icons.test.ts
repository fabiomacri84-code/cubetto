import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { matchObjectIcon } from "../../app/lib/icon-inference";
beforeEach(()=>vi.resetModules());afterEach(()=>vi.unstubAllGlobals());
it("finds glasses from the actual offline catalog",()=>{
 expect(matchObjectIcon("occhiali")).toBe("👓");expect(matchObjectIcon("Occhiali da sole")).toBe("🕶");
});
it("suggests at most two validated icons, never photos",async()=>{
 const fetch=vi.fn(async(url:URL)=>({ok:true,json:async()=>url.pathname==="/search"?{icons:["lucide:glasses","fluent-emoji-flat:glasses","bad:photo"]}:{icons:{glasses:{body:"<path />"}}}}));vi.stubGlobal("fetch",fetch);
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 const icons=await findOnlineIcons("occhiali");expect(icons).toHaveLength(2);
 expect(icons[0].photoTitle).toBe("Iconify:lucide:glasses");expect(icons[0].imageUrl).toBe("https://api.iconify.design/lucide/glasses.svg");
 expect(fetch.mock.calls[0][0].searchParams.get("query")).toBe("glasses");
});
it("rejects arbitrary identities and nonexistent icons",async()=>{
 const fetch=vi.fn(async()=>({ok:true,json:async()=>({icons:{}})}));vi.stubGlobal("fetch",fetch);
 const {resolveOnlineIcon}=await import("../../app/lib/online-icons");
 expect(await resolveOnlineIcon("Iconify:evil:a")).toBeNull();expect(fetch).not.toHaveBeenCalled();
 expect(await resolveOnlineIcon("Iconify:lucide:unknown")).toBeNull();
});
it.each(["Pepsi", "coca cola", "Coca-Cola", "cocacola"])("resolves the exact %s brand even when search omits it", async (name) => {
 const slug = name === "Pepsi" ? "pepsi" : "cocacola";
 const fetch = vi.fn(async (url: URL) => ({ok:true,json:async()=>url.pathname === "/simple-icons.json" ? {icons:{[slug]:{body:"<path />",hidden:true}}} : {icons:[]}}));
 vi.stubGlobal("fetch", fetch);
 const {findOnlineIcons} = await import("../../app/lib/online-icons");
 const icons = await findOnlineIcons(name);
 expect(icons).toHaveLength(1);
 expect(icons[0]).toMatchObject({photoTitle:`Iconify:simple-icons:${slug}`,imageUrl:`https://api.iconify.design/simple-icons/${slug}.svg`,attribution:"Simple Icons Collaborators · CC0-1.0"});
 expect(fetch).toHaveBeenCalledTimes(1);
 expect(fetch.mock.calls[0][0].searchParams.get("icons")).toBe(slug);
});
it("includes the brand catalog in general searches while filtering other sources", async () => {
 const fetch = vi.fn(async (url:URL) => ({ok:true,json:async()=>url.pathname === "/search" ? {icons:["photo:person", "simple-icons:nike"]} : {icons:{nike:{body:"<path />"}}}}));
 vi.stubGlobal("fetch",fetch);
 const {findOnlineIcons} = await import("../../app/lib/online-icons");
 const icons = await findOnlineIcons("nike");
 expect(icons).toHaveLength(1);
 expect(icons[0].photoTitle).toBe("Iconify:simple-icons:nike");
 expect(fetch.mock.calls[0][0].searchParams.get("prefixes")?.split(",")).toContain("simple-icons");
});
it("does not suggest a missing brand identity and falls back to catalog search", async () => {
 const fetch = vi.fn(async (url:URL) => ({ok:true,json:async()=>url.pathname === "/search" ? {icons:["lucide:cup-soda"]} : url.pathname === "/lucide.json" ? {icons:{"cup-soda":{body:"<path />"}}} : {icons:{}}}));
 vi.stubGlobal("fetch",fetch);
 const {findOnlineIcons} = await import("../../app/lib/online-icons");
 expect(await findOnlineIcons("pepsi")).toMatchObject([{photoTitle:"Iconify:lucide:cup-soda"}]);
 expect(fetch).toHaveBeenCalledTimes(3);
});
it.each([
 ["sapone per le mani", "soap"],
 ["Shampoo delicato", "lotion bottle"],
 ["caffè macinato", "hot beverage"],
 ["spazzolini da viaggio", "toothbrush"],
 ["occhiali da sole graduati", "sunglasses"],
 ["carota", "carrot"],
])("translates the useful catalog object in %s to %s", async (name, query) => {
 const fetch=vi.fn(async()=>({ok:true,json:async()=>({icons:[]})}));
 vi.stubGlobal("fetch",fetch);
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 await findOnlineIcons(name);
 const url = (fetch.mock.calls as unknown as Array<[URL]>)[0][0];
 expect(url.searchParams.get("query")).toBe(query);
});
it("does not match partial Italian words inside unrelated names", async () => {
 const fetch=vi.fn(async()=>({ok:true,json:async()=>({icons:[]})}));
 vi.stubGlobal("fetch",fetch);
 const {findOnlineIcons}=await import("../../app/lib/online-icons");
 await findOnlineIcons("insaponato");
 const url = (fetch.mock.calls as unknown as Array<[URL]>)[0][0];
 expect(url.searchParams.get("query")).toBe("insaponato");
});
