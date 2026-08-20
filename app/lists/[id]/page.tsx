import { notFound } from "next/navigation";
import Link from "next/link";
import {
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
import { IconImage } from "../../components/icon-image";
import { ImageUploadButton } from "../../components/image-upload";
import { DeleteItemButton } from "../../components/delete-item-button";
import { ListRefresher } from "../../components/list-refresher";
import { ListAddSheet } from "../../components/list-add-sheet";
import { AppShell } from "../../components/app-shell";
import { groupByCategory } from "../../lib/items";
import type { GroupableItem } from "../../lib/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function Tile({
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
  const image = item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.imageUrl}
      alt=""
      className="h-full w-full object-cover"
    />
  ) : (
    <IconImage emoji={item.emoji} className="h-8 w-8" />
  );

  return (
    <li className="relative">
      {stored ? (
        <div className="tile tile-done h-full p-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-2xl opacity-70">
            {image}
          </span>
          <p className="mt-2 truncate text-sm font-medium text-text-3">
            {item.name}
          </p>
          {item.quantity > 1 ? (
            <p className="tnum text-xs text-text-3">×{item.quantity}</p>
          ) : null}
        </div>
      ) : canEdit ? (
        <div className={`tile h-full p-3 ${item.checked ? "tile-done" : ""}`}>
          <form action={toggleItem}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              aria-label={item.checked ? "Da rifare" : "Fatto"}
              className="block w-full text-left"
            >
              <span className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-2xl">
                  {image}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    item.checked
                      ? "bg-positive text-white"
                      : "border-2 border-line-strong bg-surface"
                  }`}
                  aria-hidden
                >
                  {item.checked ? "✓" : null}
                </span>
              </span>
              <p
                className={`mt-2 truncate text-sm font-semibold ${
                  item.checked ? "text-text-3 line-through" : "text-text"
                }`}
              >
                {item.name}
              </p>
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-full border border-line bg-white p-0.5 shadow-sm">
              <form action={setItemQuantity}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="quantity"
                  value={Math.max(1, item.quantity - 1)}
                />
                <button
                  type="submit"
                  aria-label="Diminuisci quantità"
                  disabled={item.quantity <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-text-2 hover:bg-subtle disabled:opacity-40"
                >
                  −
                </button>
              </form>
              <span className="tnum min-w-6 text-center text-sm font-semibold text-text">
                {item.quantity}
              </span>
              <form action={setItemQuantity}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="quantity"
                  value={Math.min(999, item.quantity + 1)}
                />
                <button
                  type="submit"
                  aria-label="Aumenta quantità"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-text-2 hover:bg-subtle"
                >
                  ＋
                </button>
              </form>
            </div>

            {isOwner ? (
              <>
                <ImageUploadButton action={setItemImage} itemId={item.id} />
                {item.imageUrl ? (
                  <form action={clearItemImage}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      aria-label="Rimuovi foto"
                      className="flex h-7 w-7 items-center justify-center rounded text-xs text-text-3 hover:bg-negative-soft hover:text-negative"
                    >
                      ✕
                    </button>
                  </form>
                ) : null}
                {!item.checked ? (
                  <DeleteItemButton itemId={item.id} name={item.name} />
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={`tile h-full p-3 ${item.checked ? "tile-done" : ""}`}>
          <span className="flex items-start justify-between">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-2xl">
              {image}
            </span>
            {item.checked ? (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-positive text-sm font-bold text-white"
                aria-hidden
              >
                ✓
              </span>
            ) : (
              <span
                className="h-7 w-7 shrink-0 rounded-full border-2 border-line-strong bg-surface"
                aria-hidden
              />
            )}
          </span>
          <p
            className={`mt-2 truncate text-sm font-semibold ${
              item.checked ? "text-text-3 line-through" : "text-text"
            }`}
          >
            {item.name}
          </p>
          {item.quantity > 1 ? (
            <p className="tnum mt-0.5 text-xs text-text-3">×{item.quantity}</p>
          ) : null}
        </div>
      )}
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

  const [list, categories, packs] = await Promise.all([
    prisma.list.findUnique({
      where: { id },
      include: {
        items: {
          include: { category: { select: { id: true, name: true, emoji: true } } },
          orderBy: [{ checked: "asc" }, { sortOrder: "asc" }],
        },
        members: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.pack.findMany({
      where: { ownerId: user.id },
      include: { items: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

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

  const todo = groupByCategory(list.items.filter((i) => !i.checked && !i.stored));
  const done = groupByCategory(list.items.filter((i) => i.checked && !i.stored));
  const stored = groupByCategory(list.items.filter((i) => i.stored));
  const active = list.items.filter((i) => !i.stored);
  const total = active.length;
  const completed = active.filter((i) => i.checked).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const suggestions = list.items
    .filter((i) => !i.stored)
    .map((i) => ({
      name: i.name,
      emoji: i.emoji,
      quantity: i.quantity,
      categoryId: i.categoryId,
    }))
    .filter(
      (item, index, arr) =>
        arr.findIndex((s) => s.name.toLowerCase() === item.name.toLowerCase()) ===
        index,
    );

  const userLists = await prisma.list.findMany({
    where: { members: { some: { userId: user.id } } },
    select: { id: true, name: true, emoji: true, color: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell
      user={user}
      lists={userLists}
      packs={packs.map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        color: p.color,
      }))}
      activeListId={list.id}
    >
      <ListRefresher
        listId={list.id}
        initialUpdatedAt={list.updatedAt.toISOString()}
        initialMembers={list.members.length}
        initialPresent={[...present].sort().join(",")}
      />

      {/* ===== Header ===== */}
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
              style={{ backgroundColor: `${list.color}1c` }}
              aria-hidden
            >
              <IconImage emoji={list.emoji} className="h-9 w-9" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-text">
                {list.name}
              </h1>
              <p className="tnum text-xs text-text-3">
                {completed}/{total} fatti
              </p>
            </div>
          </div>

          {list.members.length > 1 ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {list.members.map((member) => (
                <span
                  key={member.id}
                  className="flex items-center gap-1.5 text-xs text-text-3"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      present.has(member.userId)
                        ? "bg-emerald-500"
                        : "bg-line-strong"
                    }`}
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
            <div className="progress-track h-2 flex-1">
              <div
                className="progress-fill h-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: list.color,
                }}
              />
            </div>
            {canEdit && total > 0 ? (
              <form action={emptyList}>
                <input type="hidden" name="listId" value={list.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-2 shadow-sm hover:bg-subtle"
                >
                  Svuota
                </button>
              </form>
            ) : null}
          </div>

          {isOwner || (canEdit && packs.length > 0) ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-text-2 shadow-sm hover:bg-subtle [&::-webkit-details-marker]:hidden">
                      🔗 Condividi
                    </summary>
                    <div className="card mt-2 flex w-full max-w-sm flex-col gap-2 p-4">
                      {list.inviteCode ? (
                        <>
                          <p className="tnum rounded-xl border border-line-strong bg-subtle px-3 py-2 text-center font-mono text-sm font-bold tracking-widest text-accent-strong">
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

                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-text-2 shadow-sm hover:bg-subtle [&::-webkit-details-marker]:hidden">
                      ⚙️ Gestisci
                    </summary>
                    <div className="card mt-2 w-full max-w-sm p-4">
                      {list.members.length > 1 ? (
                        <ul className="divide-y divide-line-soft">
                          {list.members.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center gap-2 py-2 text-sm first:pt-0 last:pb-0"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  present.has(member.userId)
                                    ? "bg-emerald-500"
                                    : "bg-line-strong"
                                }`}
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
                                    {member.role === "editor"
                                      ? "modifica"
                                      : "sola lettura"}
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
                                      className="rounded-full border border-line-strong px-2 py-1 text-[10px] font-semibold text-text-2 hover:bg-subtle"
                                      aria-label="Cambia ruolo"
                                    >
                                      {member.role === "editor"
                                        ? "→ sola lettura"
                                        : "→ modifica"}
                                    </button>
                                  </form>
                                  <form action={removeMember}>
                                    <input type="hidden" name="listId" value={list.id} />
                                    <input type="hidden" name="memberId" value={member.id} />
                                    <button
                                      type="submit"
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-text-3 hover:bg-negative-soft hover:text-negative"
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
                          Nessun altro membro: genera un codice invito per
                          condividere la lista.
                        </p>
                      )}
                      <form action={deleteList} className="mt-3">
                        <input type="hidden" name="id" value={list.id} />
                        <Button type="submit" variant="danger" size="sm" className="w-full">
                          Elimina lista
                        </Button>
                      </form>
                    </div>
                  </details>
                </>
              ) : null}

              {canEdit && packs.length > 0 ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-text-2 shadow-sm hover:bg-subtle [&::-webkit-details-marker]:hidden">
                    🧳 Aggiungi pack
                  </summary>
                  <div className="card mt-2 grid w-full max-w-sm grid-cols-2 gap-2 p-4">
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
            </div>
          ) : null}
        </div>
      </header>

      {/* ===== Contenuto ===== */}
      <div className="mx-auto w-full max-w-5xl px-4 pb-40 pt-4 sm:px-6 lg:px-10 lg:pb-20">
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-3">
            <span className="h-2 w-2 rounded-full bg-negative" aria-hidden />
            Da fare
            <span className="tnum ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px]">
              {todo.reduce((n, g) => n + g.items.length, 0)}
            </span>
          </h2>

          {todo.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="text-4xl" aria-hidden>
                🎉
              </span>
              <p className="text-base font-bold text-text">Niente da fare!</p>
              <p className="max-w-xs text-sm leading-6 text-text-3">
                Tutto fatto. Aggiungi qualcosa o prendi una pausa.
              </p>
            </div>
          ) : (
            todo.map((group) => (
              <div key={group.key} className="mt-3">
                {todo.length > 1 ? (
                  <p className="px-1 pb-2 text-sm font-semibold text-text-2">
                    {group.emoji} {group.name}
                  </p>
                ) : null}
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <Tile
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
        </section>

        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-3">
              <span className="h-2 w-2 rounded-full bg-positive" aria-hidden />
              Fatto
              <span className="tnum ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px]">
                {done.reduce((n, g) => n + g.items.length, 0)}
              </span>
            </h2>
            {done.map((group) => (
              <div key={group.key} className="mt-3">
                {done.length > 1 ? (
                  <p className="px-1 pb-2 text-sm font-semibold text-text-2">
                    {group.emoji} {group.name}
                  </p>
                ) : null}
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <Tile
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      isOwner={isOwner}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null}

        {stored.length > 0 ? (
          <details className="group mt-8">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-text-2 shadow-sm [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2" aria-hidden>
                🗃️
              </span>
              Cassetto
              <span className="tnum rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">
                {stored.reduce((n, g) => n + g.items.length, 0)}
              </span>
              <span className="ml-auto transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <div className="mt-3">
              {stored.map((group) => (
                <div key={group.key}>
                  <p className="px-1 pb-2 text-sm font-semibold text-text-2">
                    {group.emoji} {group.name}
                  </p>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {group.items.map((item) => (
                      <Tile
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        isOwner={isOwner}
                        stored
                      />
                    ))}
                  </ul>
                  {canEdit ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <form key={item.id} action={restoreItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-accent-line bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent-strong hover:bg-accent-soft"
                          >
                            Riprendi {item.name}
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {/* ===== FAB ===== */}
      {canEdit ? (
        <div className="fixed bottom-5 right-4 z-40 lg:bottom-8 lg:right-8">
          <ListAddSheet
            listId={list.id}
            categories={categories}
            suggestions={suggestions}
          />
        </div>
      ) : null}
    </AppShell>
  );
}