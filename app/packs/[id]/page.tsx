import { notFound } from "next/navigation";
import Link from "next/link";
import { deletePack, deletePackItem } from "../../actions";
import { setPackItemImage, clearPackItemImage } from "../../images-actions";
import { requireUser } from "../../auth";
import { prisma } from "../../db";
import { Button } from "../../components/ui/button";
import { IconImage } from "../../components/icon-image";
import { ImageUploadButton } from "../../components/image-upload";
import { PackAddSheet } from "../../components/pack-add-sheet";
import { AppShell } from "../../components/app-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [pack, categories, lists, packs] = await Promise.all([
    prisma.pack.findUnique({
      where: { id },
      include: {
        items: {
          include: { category: { select: { id: true, name: true, emoji: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.list.findMany({
      where: { members: { some: { userId: user.id } } },
      select: { id: true, name: true, emoji: true, color: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pack.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, emoji: true, color: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!pack || pack.ownerId !== user.id) {
    notFound();
  }

  const suggestions = pack.items
    .map((item) => ({
      name: item.name,
      emoji: item.emoji,
      quantity: item.quantity,
      categoryId: item.categoryId,
    }))
    .filter(
      (item, index, arr) =>
        arr.findIndex((s) => s.name.toLowerCase() === item.name.toLowerCase()) ===
        index,
    );

  return (
    <AppShell
      user={user}
      lists={lists}
      packs={packs}
      activePackId={pack.id}
    >
      <header className="page-header border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-4 pb-3 pt-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-lg text-text-2 shadow-sm hover:bg-subtle"
              aria-label="Torna alla home"
            >
              ←
            </Link>
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: `${pack.color}1c` }}
              aria-hidden
            >
              <IconImage emoji={pack.emoji} className="h-9 w-9" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-text">
                {pack.name}
              </h1>
              <p className="tnum text-xs text-text-3">
                {pack.items.length} elementi
              </p>
            </div>
            <form action={deletePack}>
              <input type="hidden" name="id" value={pack.id} />
              <Button type="submit" variant="danger" size="sm">
                Elimina
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 pb-40 pt-4 sm:px-6 lg:px-10 lg:pb-20">
        {pack.items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-soft text-3xl" aria-hidden>
              🧳
            </span>
            <p className="text-lg font-bold text-text">Pack vuoto</p>
            <p className="max-w-xs text-sm leading-6 text-text-3">
              Aggiungi i tuoi elementi: li riuserai in ogni lista con un tap.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pack.items.map((item) => (
              <div key={item.id} className="tile relative p-3">
                <span className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-2xl">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <IconImage emoji={item.emoji} className="h-8 w-8" />
                    )}
                  </span>
                </span>
                <p className="mt-2 truncate text-sm font-semibold text-text">
                  {item.name}
                </p>
                <p className="tnum mt-0.5 truncate text-xs text-text-3">
                  {item.category
                    ? `${item.category.emoji} ${item.category.name}`
                    : "Senza categoria"}
                  {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                </p>

                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <ImageUploadButton action={setPackItemImage} itemId={item.id} />
                  {item.imageUrl ? (
                    <form action={clearPackItemImage}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        aria-label="Rimuovi foto"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-xs text-text-3 shadow-sm hover:bg-negative-soft hover:text-negative"
                      >
                        ✕
                      </button>
                    </form>
                  ) : null}
                  <form action={deletePackItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      aria-label={`Elimina ${item.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-sm text-text-3 shadow-sm hover:bg-negative-soft hover:text-negative"
                    >
                      🗑
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-5 right-4 z-40 lg:bottom-8 lg:right-8">
        <PackAddSheet
          packId={pack.id}
          categories={categories}
          suggestions={suggestions}
        />
      </div>
    </AppShell>
  );
}