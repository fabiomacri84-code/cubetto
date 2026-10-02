import {afterEach,expect,it,vi} from "vitest";
import {relatedIconQueries} from "../../app/lib/icon-search-terms";
afterEach(()=>vi.unstubAllGlobals());
function reply(search:unknown[]) {vi.stubGlobal("fetch",vi.fn(async()=>({ok:true,json:async()=>({search})})));}
it("recognizes an unknown drink from public descriptions without special-casing its name",async()=>{
 reply([{label:"Chinotto",description:"soft drink",match:{text:"chinotto"}},{label:"Citrus myrtifolia",description:"species of plant",match:{text:"Chinotto di Savona"}}]);
 expect(await relatedIconQueries("chinotto")).toEqual(["soda"]);
});
it("ignores people and partial matches, keeping the product meaning",async()=>{
 reply([{label:"Fanta",description:"family name",match:{text:"Fanta"}},{label:"Fanta",description:"carbonated beverages",match:{text:"Fanta"}},{label:"science fiction",description:"genre",match:{text:"fantascienza"}}]);
 expect(await relatedIconQueries("fanta")).toEqual(["soda"]);
});
it("uses translated object labels as well as category",async()=>{
 reply([{label:"toothpaste",description:"paste used to clean teeth",match:{text:"dentifricio"}}]);
 expect(await relatedIconQueries("dentifricio")).toEqual(["toothpaste"]);
});
it("returns no invented suggestion on unavailable knowledge service",async()=>{
 vi.stubGlobal("fetch",vi.fn(async()=>{throw new Error("offline");}));expect(await relatedIconQueries("qualcosa sconosciuta")).toEqual([]);
});
