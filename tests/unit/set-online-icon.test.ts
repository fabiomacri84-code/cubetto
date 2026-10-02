import { beforeEach, expect, it, vi } from "vitest";
const { owner, resolve, updateItem, updatePackItem }=vi.hoisted(()=>({owner:vi.fn(),resolve:vi.fn(),updateItem:vi.fn(),updatePackItem:vi.fn()}));
vi.mock("../../app/auth",()=>({requireUser:async()=>({id:"owner"})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("../../app/lib/online-icons",()=>({resolveOnlineIcon:resolve}));
vi.mock("../../app/db",()=>({prisma:{item:{findUnique:owner,update:updateItem},list:{update:vi.fn()},packItem:{findUnique:owner,update:updatePackItem}}}));
import {setItemEmoji,setPackItemEmoji} from "../../app/images-actions";
beforeEach(()=>{vi.clearAllMocks();resolve.mockResolvedValue({imageUrl:"https://api.iconify.design/lucide/glasses.svg",attribution:"Lucide · ISC",sourceUrl:"https://icon-sets.iconify.design/lucide/glasses/"});});
it.each(["list","pack"])("persists validated online icons on an existing %s object",async(kind)=>{
 owner.mockResolvedValue({id:"item",listId:"list",packId:"pack",list:{ownerId:"owner"},pack:{ownerId:"owner"}});
 const data=new FormData();data.set("id","item");data.set("emoji","👓");data.set("photoTitle","Iconify:lucide:glasses");data.set("imageUrl","https://evil.example/photo.jpg");
 await (kind==="list"?setItemEmoji:setPackItemEmoji)(data);
 expect(kind==="list"?updateItem:updatePackItem).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({imageUrl:"https://api.iconify.design/lucide/glasses.svg",imageSource:"manual",imageAttribution:"Lucide · ISC"})}));
});
it("checks ownership before resolving an online icon",async()=>{
 owner.mockResolvedValue({list:{ownerId:"someone"}});const data=new FormData();data.set("id","item");data.set("emoji","👓");data.set("photoTitle","Iconify:lucide:glasses");
 await expect(setItemEmoji(data)).rejects.toThrow();expect(resolve).not.toHaveBeenCalled();
});
