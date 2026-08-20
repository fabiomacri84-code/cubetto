import { requireUser } from "./auth";
import { logout } from "./auth-actions";
import { createList, createPack, joinList } from "./actions";
import { prisma } from "./db";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Field } from "./components/ui/field";
import { Input } from "./components/ui/input";
import { IconImage } from "./components/icon-image";
import { IconPicker } from "./components/icon-picker";
import Link from "next/link";
import packageJson from "../package.json";

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
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold text-text">
          <span aria-hidden>🧳</span> Cubetto
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-subtle text-text-2 hover:bg-surface-2"
            aria-label="Impostazioni"
            title="Impostazioni"
          >
            ⚙️
          </Link>
          <span className="rounded-full border border-line bg-subtle px-3 py-1 text-xs font-medium text-text-2">
            {user.name}
          </span>
          <form action={logout}>
            <Button type="submit" variant="tertiary" size="sm">
              Esci
            </Button>
          </form>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="flex items-baseline justify-between text-lg font-semibold text-text">
          Le mie liste
          <span className="tnum text-xs font-normal text-text-3">
            {lists.length}
          </span>
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {lists.map((list) => {
            const total = list.items.length;
            const done = list.items.filter((i) => i.checked).length;
            const isOwner = list.members.some(
              (m) => m.userId === user.id && m.role === "owner",
            );

            return (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="group rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-subtle"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md text-2xl"
                  style={{ backgroundColor: `${list.color}1a` }}
                  aria-hidden
                >
                  <IconImage emoji={list.emoji} className="h-8 w-8" />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-text">
                  {list.name}
                </p>
                <p className="tnum mt-1 flex items-center gap-1 text-xs text-text-3">
                  {done}/{total} fatti
                  {!isOwner ? (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      condivisa
                    </span>
                  ) : null}
                </p>
              </Link>
            );
          })}

          <details className="rounded-lg border border-dashed border-line-strong bg-subtle p-4 group-open:border-solid">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-sm font-medium text-text-2 [&::-webkit-details-marker]:hidden">
              <span className="text-lg" aria-hidden>
                ＋
              </span>
              Nuova lista
            </summary>
            <form action={createList} className="mt-3 flex flex-col gap-3">
              <Field label="Nome">
                <Input name="name" type="text" required placeholder="es. Spesa settimanale" />
              </Field>
              <IconPicker name="emoji" initial="🛒" />
              <Button type="submit" variant="primary" size="sm">
                Crea lista
              </Button>
            </form>
          </details>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-baseline justify-between text-lg font-semibold text-text">
          I tuoi pack
          <span className="tnum text-xs font-normal text-text-3">
            {packs.length}
          </span>
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="group rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-subtle"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md text-2xl"
                style={{ backgroundColor: `${pack.color}1a` }}
                aria-hidden
              >
                <IconImage emoji={pack.emoji} className="h-8 w-8" />
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-text">
                {pack.name}
              </p>
              <p className="tnum mt-1 text-xs text-text-3">
                {pack.items.length} elementi
              </p>
            </Link>
          ))}

          <details className="rounded-lg border border-dashed border-line-strong bg-subtle p-4 group-open:border-solid">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-sm font-medium text-text-2 [&::-webkit-details-marker]:hidden">
              <span className="text-lg" aria-hidden>
                ＋
              </span>
              Nuovo pack
            </summary>
            <form action={createPack} className="mt-3 flex flex-col gap-3">
              <Field label="Nome">
                <Input name="name" type="text" required placeholder="es. Valigia estate" />
              </Field>
              <IconPicker name="emoji" initial="🧳" />
              <Button type="submit" variant="primary" size="sm">
                Crea pack
              </Button>
            </form>
          </details>
        </div>
      </section>

      <Card className="mt-8">
        <h3 className="text-sm font-semibold text-text">Unisciti a una lista</h3>
        <p className="mt-1 text-xs leading-5 text-text-3">
          Inserisci il codice di invito che ti ha dato chi condivide la lista.
        </p>
        <form action={joinList} className="mt-3 flex gap-2">
          <Input
            name="inviteCode"
            type="text"
            required
            placeholder="es. A1B2C3D4"
            className="min-h-9"
          />
          <Button type="submit" variant="secondary" size="sm">
            Unisciti
          </Button>
        </form>
      </Card>

      <p className="mt-8 text-center text-xs text-text-3">
        v{packageJson.version}
      </p>
    </main>
  );
}