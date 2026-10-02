import { notFound } from "next/navigation";
import Link from "next/link";
import { deletePack, updatePackMeta } from "../../actions";
import { setPackItemImage, clearPackItemImage, setPackImage, clearPackImage, setPackEmoji,
  setPackItemEmoji, updatePackItemMeta } from "../../images-actions";
import { requireUser } from "../../auth";
import { prisma } from "../../db";
import { Button } from "../../components/ui/button";
import { IconImage } from "../../components/icon-image";
import { PhotoCredit } from "../../components/photo-credit";
import { PackAddSheet } from "../../components/pack-add-sheet";
import { PackEditor } from "../../components/pack-editor";
import { DeleteItemButton } from "../../components/delete-item-button";
import { ItemEditor } from "../../components/item-editor";
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

  const [pack, lists, packs] = await Promise.all([
    prisma.pack.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
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
              <IconImage emoji={pack.emoji} imageUrl={pack.imageUrl} className="h-9 w-9 rounded-xl" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-text">
                {pack.name}
              </h1>
              <PhotoCredit attribution={pack.imageAttribution} sourceUrl={pack.imageSourceUrl} />
              <p className="tnum text-xs text-text-3">
                {pack.items.length} elementi
              </p>
            </div>
            <PackEditor
              pack={pack}
              setPackImage={setPackImage}
              setPackEmoji={setPackEmoji}
              clearPackImage={clearPackImage}
              updatePackMeta={updatePackMeta}
              className="relative h-12 w-12"
            />
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
              <ItemEditor
                key={item.id}
                item={item}
                setItemImage={setPackItemImage}
                setItemEmoji={setPackItemEmoji}
                clearItemImage={clearPackItemImage}
                updateItemMeta={updatePackItemMeta}
                className="relative h-full"
              >
                <div className="tile relative h-full p-3">
                  <span className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-2xl">
                      <IconImage emoji={item.emoji} imageUrl={item.imageUrl} className="h-8 w-8 rounded-lg" />
                    </span>
                  </span>
                  <p className="mt-2 truncate text-sm font-semibold text-text">
                    {item.name}
                  </p>
                  <PhotoCredit attribution={item.imageAttribution} sourceUrl={item.imageSourceUrl} />
                  <p className="tnum mt-0.5 truncate text-xs text-text-3">
                    {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </p>

                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <DeleteItemButton itemId={item.id} name={item.name} scope="pack" />
                  </div>
                </div>
              </ItemEditor>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-5 right-4 z-40 lg:bottom-8 lg:right-8">
        <PackAddSheet
          packId={pack.id}
          suggestions={suggestions}
        />
      </div>
    </AppShell>
  );
}