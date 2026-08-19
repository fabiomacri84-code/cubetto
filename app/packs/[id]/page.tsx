import { notFound } from "next/navigation";
import Link from "next/link";
import { addPackItem, deletePack, deletePackItem } from "../../actions";
import { setPackItemImage, clearPackItemImage } from "../../images-actions";
import { requireUser } from "../../auth";
import { prisma } from "../../db";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Field } from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { EmojiPicker } from "../../components/emoji-picker";
import { ImageUploadButton } from "../../components/image-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const pack = await prisma.pack.findUnique({
    where: { id },
    include: {
      items: {
        include: { category: { select: { id: true, name: true, emoji: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!pack || pack.ownerId !== user.id) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-32 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line-strong text-text-2 hover:bg-surface-2"
          aria-label="Torna alla home"
        >
          ←
        </Link>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md text-2xl"
          style={{ backgroundColor: `${pack.color}1a` }}
          aria-hidden
        >
          {pack.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-text">{pack.name}</h1>
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
      </header>

      <Card className="mt-5 p-3">
        {pack.items.length === 0 ? (
          <p className="py-2 text-center text-sm text-text-3">
            Pack vuoto: aggiungi i tuoi elementi qui sotto.
          </p>
        ) : (
          <ul>
            {pack.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 border-b border-line-soft py-2 last:border-b-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2 text-xl">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden>{item.emoji}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {item.name}
                  </p>
                  <p className="text-xs text-text-3">
                    {item.category
                      ? `${item.category.emoji} ${item.category.name}`
                      : "Senza categoria"}
                    {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ImageUploadButton action={setPackItemImage} itemId={item.id} />
                  {item.imageUrl ? (
                    <form action={clearPackItemImage}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="flex h-7 w-7 items-center justify-center rounded text-text-3 hover:bg-error/10 hover:text-error"
                        aria-label="Rimuovi foto"
                      >
                        ✕
                      </button>
                    </form>
                  ) : null}
                  <form action={deletePackItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="flex h-7 w-7 items-center justify-center rounded text-text-3 hover:bg-error/10 hover:text-error"
                      aria-label={`Elimina ${item.name}`}
                    >
                      🗑
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <details className="rounded-md border border-line-strong bg-subtle">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-2 [&::-webkit-details-marker]:hidden">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                ＋
              </span>
              Aggiungi elemento
            </summary>
            <form action={addPackItem} className="flex flex-col gap-3 p-3">
              <input type="hidden" name="packId" value={pack.id} />
              <div className="flex gap-2">
                <EmojiPicker initial="📦" />
                <Field label="Nome">
                  <Input
                    name="name"
                    type="text"
                    required
                    placeholder="es. Asciugamano"
                  />
                </Field>
              </div>
              <div className="flex gap-2">
                <Field label="Quantità">
                  <Input
                    name="quantity"
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={1}
                    className="min-h-9 w-20"
                  />
                </Field>
                <Field label="Categoria">
                  <select
                    name="categoryId"
                    className="min-h-9 w-full rounded-md border border-line-strong bg-subtle px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
                  >
                    <option value="">Senza categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Button type="submit" variant="primary">
                Aggiungi
              </Button>
            </form>
          </details>
        </div>
      </div>
    </main>
  );
}