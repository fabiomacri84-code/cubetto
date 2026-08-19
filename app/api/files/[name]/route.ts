import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "../../../auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const { name } = await params;

  if (!/^[a-f0-9]{32}\.(png|jpg|jpeg|webp|gif|avif)$/.test(name)) {
    return new Response("Non trovato", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", name);

  try {
    const buffer = await fs.readFile(filePath);

    const contentType =
      name.endsWith(".png") ? "image/png"
      : name.endsWith(".jpg") || name.endsWith(".jpeg") ? "image/jpeg"
      : name.endsWith(".webp") ? "image/webp"
      : name.endsWith(".gif") ? "image/gif"
      : "image/avif";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Non trovato", { status: 404 });
  }
}