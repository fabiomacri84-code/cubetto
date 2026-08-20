import { getCurrentUser } from "../../../../auth";
import { prisma } from "../../../../db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.list.findFirst({
    where: {
      id,
      members: { some: { userId: user.id } },
    },
    select: {
      updatedAt: true,
      members: { select: { id: true } },
    },
  });

  if (!list) {
    return Response.json({ error: "Non trovato" }, { status: 404 });
  }

  const PRESENCE_WINDOW_MS = 15_000;
  const cutOff = new Date(Date.now() - PRESENCE_WINDOW_MS);

  const presences = await prisma.presence.findMany({
    where: { listId: id, updatedAt: { gt: cutOff } },
    select: { userId: true },
  });

  return Response.json({
    updatedAt: list.updatedAt.toISOString(),
    members: list.members.length,
    present: presences.map((p) => p.userId),
  });
}
