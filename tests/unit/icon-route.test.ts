import { beforeEach, expect, it, vi } from "vitest";
const { user, findImage } = vi.hoisted(() => ({ user: vi.fn(), findImage: vi.fn() }));
vi.mock("../../app/auth", () => ({ getCurrentUser: user }));
vi.mock("../../app/lib/online-images", () => ({ findImage }));
import { POST } from "../../app/api/icon-suggestion/route";
const request = (body: unknown) => new Request("http://localhost/api/icon-suggestion", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { user.mockReset().mockResolvedValue({ id: "test" }); findImage.mockReset().mockResolvedValue(null); });
it("does not query remote providers for unauthenticated or invalid requests", async () => {
  user.mockResolvedValueOnce(null);
  expect((await POST(request({ name: "Irlanda" }))).status).toBe(401);
  for (const name of ["", "a".repeat(81), "<script>", 3]) expect((await POST(request({ name }))).status).toBe(400);
  expect(findImage).not.toHaveBeenCalled();
});
it("tries objects and preserves fallback while forbidding cache", async () => {
  const response = await POST(request({ name: "Latte" }));
  expect(findImage).toHaveBeenCalledWith("Latte");
  expect(await response.json()).toEqual({ emoji: "🥛" });
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});
it("returns trusted photo metadata or an unavailable status", async () => {
  findImage.mockResolvedValueOnce({ imageUrl: "https://upload.wikimedia.org/a.jpg", photoTitle: "File:A.jpg", attribution: "A · CC0" });
  expect(await (await POST(request({ name: "Irlanda" }))).json()).toMatchObject({ photoTitle: "File:A.jpg", attribution: "A · CC0" });
  findImage.mockRejectedValueOnce(new Error("offline"));
  expect((await POST(request({ name: "Irlanda" }))).status).toBe(503);
});
