import { beforeEach, expect, it, vi } from "vitest";
const { user, findOnlineIcons } = vi.hoisted(() => ({ user: vi.fn(), findOnlineIcons: vi.fn() }));
vi.mock("../../app/auth", () => ({ getCurrentUser: user }));
vi.mock("../../app/lib/online-icons", () => ({ findOnlineIcons }));
import { POST } from "../../app/api/icon-suggestion/route";
const request = (body: unknown) => new Request("http://localhost/api/icon-suggestion", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { user.mockReset().mockResolvedValue({ id: "test" }); findOnlineIcons.mockReset().mockResolvedValue([]); });
it("does not query remote providers for unauthenticated or invalid requests", async () => {
  user.mockResolvedValueOnce(null);
  expect((await POST(request({ name: "Oggetto ignoto QZRT" }))).status).toBe(401);
  for (const name of ["", "a".repeat(81), "<script>", 3]) expect((await POST(request({ name }))).status).toBe(400);
  expect(findOnlineIcons).not.toHaveBeenCalled();
});
it("tries objects and preserves fallback while forbidding cache", async () => {
  const response = await POST(request({ name: "Latte" }));
  expect(findOnlineIcons).not.toHaveBeenCalled();
  expect(await response.json()).toEqual({ emoji: "🥛" });
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});
it("returns trusted photo metadata or an unavailable status", async () => {
  findOnlineIcons.mockResolvedValueOnce([{ imageUrl: "https://api.iconify.design/lucide/glasses.svg", photoTitle: "Iconify:lucide:glasses", attribution: "Lucide · ISC" }]);
  expect(await (await POST(request({ name: "Oggetto ignoto QZRT" }))).json()).toMatchObject({ options: [{ photoTitle: "Iconify:lucide:glasses", attribution: "Lucide · ISC" }] });
  findOnlineIcons.mockRejectedValueOnce(new Error("offline"));
  expect((await POST(request({ name: "Oggetto ignoto QZRT" }))).status).toBe(503);
});
