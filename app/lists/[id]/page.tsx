import { notFound } from "next/navigation";
import Link from "next/link";
import {
  deleteItem,
  deleteList,
  emptyList,
  generateInviteCode,
  clearInviteCode,
  insertPack,
  restoreItem,
  setItemQuantity,
  setMemberRole,
  removeMember,
  toggleItem,
} from "../../actions";
import { setItemImage, clearItemImage } from "../../images-actions";
import { requireUser } from "../../auth";
import { prisma } from "../../db";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { IconImage } from "../../components/icon-image";
import { ImageUploadButton } from "../../components/image-upload";
import { ListRefresher } from "../../components/list-refresher";
import { AddItemForm } from "../../components/add-item-form";
import { groupByCategory } from "../../lib/items";
import type { GroupableItem } from "../../lib/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ItemRow({
  item,
  canEdit,
  isOwner,
  stored = false,
}: {
  item: GroupableItem;
  canEdit: boolean;
  isOwner: boolean;
  stored?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2.5 border-b border-line-soft py-2 last:border-b-0 ${
        item.checked ? "opacity-75" : ""
      }`}
    >
      {stored ? (
        <span
          className="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-line-strong"
          aria-hidden
        />
      ) : canEdit ? (
        <form action={toggleItem}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label={item.checked ? "Da rifare" : "Fatto"}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              item.checked
                ? "border-[#3e86b8] bg-[#3e86b8] text-white"
                : "border-[#d4554f] bg-white"
            }`}
          >
            {item.checked ? <span className="text-sm">✓</span> : null}
          </button>
        </form>
      ) : (
        <span
          className={`h-8 w-8 shrink-0 rounded-full border-2 ${
            item.checked ? "border-[#3e86b8] bg-[#3e86b8]/15" : "border-[#d4554f]/40"
          }`}
          aria-hidden
        />
      )}

      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2 text-xl">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <IconImage emoji={item.emoji} className="h-7 w-7" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            stored
              ? "text-text-3"
              : item.checked
                ? "text-text-3 line-through"
                : "font-medium text-text"
          }`}
        >
          {item.name}
        </p>
        {item.quantity > 1 ? (
          <p className="tnum text-xs text-text-3">×{item.quantity}</p>
        ) : null}
      </div>

      {stored ? (
        canEdit ? (
          <form action={restoreItem} className="shrink-0">
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="rounded-md border border-accent px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
            >
              Riprendi
            </button>
          </form>
        ) : null
      ) : canEdit ? (
        <div className="flex shrink-0 items-center gap-1">
          <form action={setItemQuantity}>
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="quantity"
              value={Math.max(1, item.quantity - 1)}
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded border border-line-strong text-text-2 hover:bg-surface-2"
              aria-label="Diminuisci quantità"
              disabled={item.quantity <= 1}
            >
              −
            </button>
          </form>
          <form action={setItemQuantity}>
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="quantity"
              value={Math.min(999, item.quantity + 1)}
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded border border-line-strong text-text-2 hover:bg-surface-2"
              aria-label="Aumenta quantità"
            >
              ＋
            </button>
          </form>
        </div>
      ) : null}

      {isOwner ? (
        <div className="flex shrink-0 items-center gap-1">
          <ImageUploadButton action={setItemImage} itemId={item.id} />
          {item.imageUrl ? (
            <form action={clearItemImage}>
              <input type="hidden" name="id" value={item.id} />
              <button
                className="flex h-7 w-7 items-center justify-center rounded text-text-3 hover:bg-error/10 hover:text-error"
                aria-label="Rimuovi foto"
              >
                ✕
              </button>
            </form>
          ) : null}
          <form action={deleteItem}>
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
      ) : null}
    </li>
  );
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      items: {
        include: { category: { select: { id: true, name: true, emoji: true } } },
        orderBy: [{ checked: "asc" }, { sortOrder: "asc" }],
      },
      members: { include: { user: { select: { name: true } } } },
    },
  });

  if (!list) {
    notFound();
  }

  const membership = list.members.find((m) => m.userId === user.id);

  if (!membership) {
    notFound();
  }

  const isOwner = membership.role === "owner";
  const canEdit = membership.role !== "viewer";

  const PRESENCE_WINDOW_MS = 15_000;
  const present = new Set(
    (
      await prisma.presence.findMany({
        where: {
          listId: id,
          // eslint-disable-next-line react-hooks/purity -- RSC eseguito a ogni richiesta
          updatedAt: { gt: new Date(Date.now() - PRESENCE_WINDOW_MS) },
        },
        select: { userId: true },
      })
    ).map((p) => p.userId),
  );

  const [categories, packs] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.pack.findMany({
      where: { ownerId: user.id },
      include: { items: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const todo = groupByCategory(list.items.filter((i) => !i.checked && !i.stored));
  const done = groupByCategory(list.items.filter((i) => i.checked && !i.stored));
  const stored = groupByCategory(list.items.filter((i) => i.stored));
  const active = list.items.filter((i) => !i.stored);
  const total = active.length;
  const completed = active.filter((i) => i.checked).length;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-32 pt-6">
      <ListRefresher
        listId={list.id}
        initialUpdatedAt={list.updatedAt.toISOString()}
        initialMembers={list.members.length}
        initialPresent={[...present].sort().join(",")}
      />
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
          style={{ backgroundColor: `${list.color}1a` }}
          aria-hidden
        >
          <IconImage emoji={list.emoji} className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-text">{list.name}</h1>
          <p className="tnum text-xs text-text-3">
            {completed}/{total} fatti
          </p>
        </div>
      </header>

      {list.members.length > 1 ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {list.members.map((member) => (
            <span
              key={member.id}
              className="flex items-center gap-1.5 text-xs text-text-3"
            >
              <span
                className={`h-2 w-2 rounded-full ${present.has(member.userId) ? "bg-emerald-500" : "bg-line-strong"}`}
                aria-hidden
              />
              <span className="truncate">
                {member.user.name}
                {member.userId === user.id ? " (tu)" : ""}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: total ? `${(completed / total) * 100}%` : "0%",
              backgroundColor: list.color,
            }}
          />
        </div>
        {canEdit && total > 0 ? (
          <form action={emptyList}>
            <input type="hidden" name="listId" value={list.id} />
            <button
              type="submit"
              className="shrink-0 rounded-md border border-line-strong px-2 py-1 text-xs font-medium text-text-2 hover:bg-surface-2"
            >
              Svuota
            </button>
          </form>
        ) : null}
      </div>

      {isOwner ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <details className="rounded-md border border-line bg-subtle px-3 py-1.5 text-sm">
            <summary className="cursor-pointer list-none font-medium text-text-2 [&::-webkit-details-marker]:hidden">
              🔗 Condividi
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {list.inviteCode ? (
                <>
                  <p className="tnum rounded-md border border-line-strong bg-surface px-3 py-2 text-center font-mono text-sm font-semibold tracking-widest text-accent">
                    {list.inviteCode}
                  </p>
                  <form action={clearInviteCode}>
                    <input type="hidden" name="id" value={list.id} />
                    <Button type="submit" variant="tertiary" size="sm" className="w-full">
                      Disattiva codice
                    </Button>
                  </form>
                </>
              ) : (
                <form action={generateInviteCode}>
                  <input type="hidden" name="id" value={list.id} />
                  <Button type="submit" variant="primary" size="sm" className="w-full">
                    Genera codice invito
                  </Button>
                </form>
              )}
            </div>
          </details>

          <details className="rounded-md border border-line bg-subtle px-3 py-1.5 text-sm">
            <summary className="cursor-pointer list-none font-medium text-text-2 [&::-webkit-details-marker]:hidden">
              ⚙️ Gestisci
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {list.members.length > 1 ? (
                <ul className="rounded-md border border-line bg-surface">
                  {list.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-2 border-b border-line-soft px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${present.has(member.userId) ? "bg-emerald-500" : "bg-line-strong"}`}
                        aria-label={
                          present.has(member.userId)
                            ? `${member.user.name} è online`
                            : `${member.user.name} è assente`
                        }
                      />
                      <span className="min-w-0 flex-1 truncate text-text">
                        {member.user.name}
                        {member.userId === user.id ? " (tu)" : ""}
                      </span>
                      {member.role === "owner" ? (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-3">
                          proprietario
                        </span>
                      ) : (
                        <>
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-3">
                            {member.role === "editor" ? "modifica" : "sola lettura"}
                          </span>
                          <form action={setMemberRole}>
                            <input type="hidden" name="listId" value={list.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <input
                              type="hidden"
                              name="role"
                              value={member.role === "editor" ? "viewer" : "editor"}
                            />
                            <button
                              type="submit"
                              className="rounded border border-line-strong px-1.5 py-0.5 text-[10px] font-medium text-text-2 hover:bg-surface-2"
                              aria-label="Cambia ruolo"
                            >
                              {member.role === "editor" ? "→ sola lettura" : "→ modifica"}
                            </button>
                          </form>
                          <form action={removeMember}>
                            <input type="hidden" name="listId" value={list.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <button
                              type="submit"
                              className="flex h-6 w-6 items-center justify-center rounded text-text-3 hover:bg-error/10 hover:text-error"
                              aria-label={`Rimuovi ${member.user.name}`}
                            >
                              ✕
                            </button>
                          </form>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-3">
                  Nessun altro membro: genera un codice invito per condividere la
                  lista.
                </p>
              )}
              <form action={deleteList}>
                <input type="hidden" name="id" value={list.id} />
                <Button type="submit" variant="danger" size="sm" className="w-full">
                  Elimina lista
                </Button>
              </form>
            </div>
          </details>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#d4554f]">
            Da fare
          </h2>
          <Card className="mt-2 p-3">
            {todo.length === 0 ? (
              <p className="py-2 text-center text-sm text-text-3">
                Niente da fare! 🎉
              </p>
            ) : (
              todo.map((group) => (
                <div key={group.key}>
                  <p className="px-1 pb-1 pt-2 text-xs font-medium text-text-3">
                    {group.emoji} {group.name}
                  </p>
                  <ul>
                    {group.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        isOwner={isOwner}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </Card>
        </section>

        {done.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3e86b8]">
              Fatto
            </h2>
            <Card className="mt-2 p-3">
              {done.map((group) => (
                <div key={group.key}>
                  <p className="px-1 pb-1 pt-2 text-xs font-medium text-text-3">
                    {group.emoji} {group.name}
                  </p>
                  <ul>
                    {group.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        isOwner={isOwner}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </section>
        ) : null}
      </div>

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-md px-4 py-3">
            <AddItemForm listId={list.id} categories={categories} />

            {packs.length > 0 ? (
              <details className="mt-2 rounded-md border border-line-strong bg-subtle">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-strong text-white">
                    🧳
                  </span>
                  Aggiungi pack
                </summary>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {packs.map((pack) => (
                    <form key={pack.id} action={insertPack}>
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="packId" value={pack.id} />
                      <Button type="submit" variant="secondary" size="sm" className="w-full justify-start">
                        <span aria-hidden>{pack.emoji}</span>
                        <span className="truncate">{pack.name}</span>
                        <span className="tnum ml-auto text-xs text-text-3">
                          {pack.items.length}
                        </span>
                      </Button>
                    </form>
                  ))}
                </div>
              </details>
) : null}

        {stored.length > 0 ? (
          <section>
            <details className="group rounded-md border border-line bg-subtle">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-3 [&::-webkit-details-marker]:hidden">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2">
                  🗃️
                </span>
                Cassetto
                <span className="tnum rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">
                  {stored.reduce((n, g) => n + g.items.length, 0)}
                </span>
                <span className="ml-auto transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t border-line-soft p-3">
                {stored.map((group) => (
                  <div key={group.key}>
                    <p className="px-1 pb-1 pt-2 text-xs font-medium text-text-3">
                      {group.emoji} {group.name}
                    </p>
                    <ul>
                      {group.items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          canEdit={canEdit}
                          isOwner={isOwner}
                          stored
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </section>
        ) : null}
      </div>
        </div>
      ) : null}
    </main>
  );
}