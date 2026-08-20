import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import {
  createUser,
  resetUserPassword,
  setUserRole,
} from "../admin-actions";
import { DeleteUserButton } from "./delete-user-button";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { prisma } from "../db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { memberships: true, ownedLists: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-lg text-text-2 shadow-sm hover:bg-subtle"
          aria-label="Torna alla home"
        >
          ←
        </Link>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-text">Amministrazione</h1>
          <p className="text-xs text-text-3">Gestione delle utenze</p>
        </div>
      </header>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-text">Nuovo utente</h2>
        <form action={createUser} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input name="name" type="text" required />
            </Field>
            <Field label="Nome utente">
              <Input name="email" type="text" required />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Password" hint="Almeno 8 caratteri.">
              <Input name="password" type="password" required minLength={8} />
            </Field>
            <Field label="Ruolo">
              <select
                name="role"
                defaultValue="user"
                className="min-h-11 w-full rounded-md border border-line-strong bg-subtle px-3 py-2 text-sm text-text transition-colors duration-150 outline-none focus:border-accent"
              >
                <option value="user">Utente</option>
                <option value="admin">Amministratore</option>
              </select>
            </Field>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Crea utente
          </Button>
        </form>
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-text">
          Utenti ({users.length})
        </h2>

        <ul className="mt-4 divide-y divide-line">
          {users.map((u) => {
            const isSelf = u.id === user.id;

            return (
              <li key={u.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-text-3">
                          (tu)
                        </span>
                      ) : null}
                    </p>
                    <p className="tnum mt-0.5 text-xs text-text-3">
                      {u.email} · dal {formatDate(u.createdAt)}
                    </p>
                  </div>
                  <span
                    className={
                      u.role === "admin"
                        ? "rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                        : "rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-3"
                    }
                  >
                    {u.role === "admin" ? "Amministratore" : "Utente"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <form
                    action={setUserRole}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={isSelf}
                      aria-label={`Ruolo di ${u.name}`}
                      className="min-h-9 flex-1 rounded-md border border-line-strong bg-subtle px-2 py-1.5 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
                    >
                      <option value="user">Utente</option>
                      <option value="admin">Amministratore</option>
                    </select>
                    <Button type="submit" size="sm" disabled={isSelf}>
                      Salva
                    </Button>
                  </form>

                  <form
                    action={resetUserPassword}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={u.id} />
                    <Input
                      name="newPassword"
                      type="password"
                      placeholder="Nuova password"
                      minLength={8}
                      required
                      aria-label={`Nuova password per ${u.name}`}
                      className="min-h-9 flex-1 px-2 py-1.5 text-sm"
                    />
                    <Button type="submit" size="sm">
                      Reimposta
                    </Button>
                  </form>

                  <DeleteUserButton userId={u.id} name={u.name} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </main>
  );
}