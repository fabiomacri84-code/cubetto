import Link from "next/link";
import { requireUser } from "./auth";
import { logout } from "./auth-actions";
import { createList, createPack, joinList } from "./actions";
import { prisma } from "./db";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { IconImage } from "./components/icon-image";
import { AppShell } from "./components/app-shell";
import { CreateSheet } from "./components/create-sheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();

  const [lists, packs] = await Promise.all([
    prisma.list.findMany({
      where: {
        members: { some: { userId: user.id } },
      },
      include: {
        items: { select: { checked: true } },
        members: { select: { userId: true, role: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pack.findMany({
      where: { ownerId: user.id },
      include: { items: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <AppShell
      user={user}
      lists={lists.map((l) => ({
        id: l.id,
        name: l.name,
        emoji: l.emoji,
        color: l.color,
      }))}
      packs={packs.map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        color: p.color,
      }))}
    >
      <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {/* Barra superiore mobile */}
        <header className="flex items-center justify-between lg:hidden">
          <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-lg" aria-hidden>
              🧳
            </span>
            Cubetto
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              href="/settings"
              aria-label="Impostazioni"
              title="Impostazioni"
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-text-2 hover:bg-subtle"
            >
              ⚙️
            </Link>
            <form action={logout}>
              <Button type="submit" variant="tertiary" size="sm">
                Esci
              </Button>
            </form>
          </div>
        </header>

        {/* Benvenuto desktop */}
        <div className="mb-8 hidden lg:block">
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            Ciao, {user.name} 👋
          </h1>
          <p className="mt-1 text-text-2">
            Le tue liste e i tuoi pack, tutto qui.
          </p>
        </div>

        {/* ===== Le mie liste ===== */}
        <section className="mt-8 lg:mt-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight text-text">
              Le mie liste
            </h2>
            <span className="tnum text-xs font-medium text-text-3">
              {lists.length}
            </span>
          </div>

          {lists.length === 0 ? (
            <div className="card mt-4 flex flex-col items-center gap-3 px-6 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-soft text-3xl" aria-hidden>
                🛒
              </span>
              <p className="text-lg font-bold text-text">
                Nessuna lista, ancora.
              </p>
              <p className="max-w-xs text-sm leading-6 text-text-3">
                Crea la tua prima lista: spesa, valigia, cosa portare… tutto
                quello che ti serve.
              </p>
              <CreateSheet
                variant="inline"
                triggerLabel="Nuova lista"
                title="Nuova lista"
                placeholder="es. Spesa settimanale"
                iconInitial="🛒"
                cta="Crea lista"
                action={createList}
                className="w-full max-w-xs"
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {lists.map((list) => {
                const total = list.items.length;
                const done = list.items.filter((i) => i.checked).length;
                const percent = total ? Math.round((done / total) * 100) : 0;
                const isOwner = list.members.some(
                  (m) => m.userId === user.id && m.role === "owner",
                );

                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="card group p-4 transition-transform active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                        style={{ backgroundColor: `${list.color}1c` }}
                        aria-hidden
                      >
                        <IconImage emoji={list.emoji} className="h-9 w-9" />
                      </span>
                      {!isOwner ? (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
                          condivisa
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 truncate text-[15px] font-bold text-text">
                      {list.name}
                    </p>
                    <p className="tnum mt-0.5 text-xs text-text-3">
                      {done}/{total} fatti
                    </p>
                    <div className="progress-track mt-2.5 h-1.5">
                      <div
                        className="progress-fill h-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: list.color,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}

              <CreateSheet
                variant="tile"
                triggerLabel="Nuova lista"
                title="Nuova lista"
                placeholder="es. Spesa settimanale"
                iconInitial="🛒"
                cta="Crea lista"
                action={createList}
              />
            </div>
          )}
        </section>

        {/* ===== I tuoi pack ===== */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight text-text">
              I tuoi pack
            </h2>
            <span className="tnum text-xs font-medium text-text-3">
              {packs.length}
            </span>
          </div>

          {packs.length === 0 ? (
            <div className="card mt-4 flex items-center gap-4 px-5 py-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl" aria-hidden>
                🧳
              </span>
              <p className="min-w-0 flex-1 text-sm leading-6 text-text-3">
                I pack sono raccolte riusabili: creali una volta e usali in
                ogni lista.
              </p>
              <CreateSheet
                variant="inline"
                triggerLabel="Nuovo pack"
                title="Nuovo pack"
                placeholder="es. Valigia estate"
                iconInitial="🧳"
                cta="Crea pack"
                action={createPack}
                className="shrink-0"
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {packs.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/packs/${pack.id}`}
                  className="card group p-4 transition-transform active:scale-[0.98]"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: `${pack.color}1c` }}
                    aria-hidden
                  >
                    <IconImage emoji={pack.emoji} className="h-9 w-9" />
                  </span>
                  <p className="mt-3 truncate text-[15px] font-bold text-text">
                    {pack.name}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-text-3">
                    {pack.items.length} elementi
                  </p>
                </Link>
              ))}

              <CreateSheet
                variant="tile"
                triggerLabel="Nuovo pack"
                title="Nuovo pack"
                placeholder="es. Valigia estate"
                iconInitial="🧳"
                cta="Crea pack"
                action={createPack}
              />
            </div>
          )}
        </section>

        {/* ===== Unisciti a una lista ===== */}
        <div className="card mt-10 flex items-center gap-2 p-2 pl-4">
          <p className="hidden shrink-0 text-sm font-semibold text-text-2 sm:block">
            Unisciti a una lista
          </p>
          <span className="text-lg sm:hidden" aria-hidden>
            🔗
          </span>
          <form action={joinList} className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              name="inviteCode"
              type="text"
              required
              placeholder="es. A1B2C3D4"
              className="min-h-11 flex-1 uppercase"
              aria-label="Codice di invito"
            />
            <Button type="submit" variant="primary" size="sm" className="shrink-0">
              Unisciti
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}