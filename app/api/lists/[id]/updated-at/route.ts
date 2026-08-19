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
    select: { updatedAt: true },
  });

  if (!list) {
    return Response.json({ error: "Non trovato" }, { status: 404 });
  }

  return Response.json({ updatedAt: list.updatedAt.toISOString() });
}
