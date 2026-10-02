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
