import { getCurrentUser } from "../../auth";
import { matchObjectIcon } from "../../lib/icon-inference";
import { findImage } from "../../lib/online-images";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };

// A read-only request must not occupy Next.js's sequential mutation queue.
export async function POST(request: Request) {
  if (!await getCurrentUser()) return Response.json({ error: "Accedi per cercare un’immagine." }, { status: 401, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Nome non valido." }, { status: 400, headers }); }
  const name = body && typeof body === "object" && "name" in body ? body.name : undefined;
  if (typeof name !== "string" || !name.trim() || name.length > 80 || /[\x00-\x1f|#<>]/.test(name)) {
    return Response.json({ error: "Nome non valido." }, { status: 400, headers });
  }
  const emoji = matchObjectIcon(name) ?? "📦";
  try {
    const image = await findImage(name);
    return Response.json(image ? { ...image, emoji } : { emoji }, { headers });
  } catch {
    return Response.json({ error: "Immagine non disponibile." }, { status: 503, headers });
  }
}
