import { getCurrentUser } from "../../../../auth";
import { prisma } from "../../../../db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;

  const membership = await prisma.listMember.findUnique({
    where: { listId_userId: { listId: id, userId: user.id } },
    select: { id: true },
  });

  if (!membership) {
    return Response.json({ error: "Non trovato" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    leave?: boolean;
  };

  if (body.leave) {
    await prisma.presence.deleteMany({
      where: { listId: id, userId: user.id },
    });
  } else {
    await prisma.presence.upsert({
      where: { listId_userId: { listId: id, userId: user.id } },
      update: { updatedAt: new Date() },
      create: { listId: id, userId: user.id },
    });
  }

  return Response.json({ ok: true });
}