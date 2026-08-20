import Link from "next/link";
import { requireUser } from "../auth";
import { changePassword } from "../auth-actions";
import { prisma } from "../db";
import { AdminPanel } from "../components/admin-panel";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";
import packageJson from "../../package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; changed?: string }>;
}) {
  const user = await requireUser();

  const isAdmin = user.role === "admin";
  const users = isAdmin
    ? await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const { error, changed } = await searchParams;
  const errorMessage =
    error === "short"
      ? "La nuova password deve avere almeno 8 caratteri."
      : error === "mismatch"
        ? "Le due password non coincidono."
        : error === "wrong"
          ? "Password attuale non corretta."
          : null;
  const successMessage = changed === "1" ? "Password aggiornata." : null;

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-24 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-lg text-text-2 shadow-sm hover:bg-subtle"
          aria-label="Torna alla home"
        >
          ←
        </Link>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-text">Impostazioni</h1>
          <p className="text-xs text-text-3">Account e password</p>
        </div>
      </header>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-text">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-text-3">Nome</dt>
            <dd className="font-medium text-text">{user.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-3">Nome utente</dt>
            <dd className="tnum font-medium text-text">{user.email}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-text">Cambia password</h2>
        <p className="mt-1 text-xs leading-5 text-text-3">
          Usa una password di almeno 8 caratteri.
        </p>

        <form action={changePassword} className="mt-4 flex flex-col gap-4">
          {errorMessage ? (
            <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              {successMessage}
            </p>
          ) : null}

          <Field label="Password attuale">
            <Input name="currentPassword" type="password" required autoFocus />
          </Field>

          <Field label="Nuova password">
            <Input name="newPassword" type="password" required minLength={8} />
          </Field>

          <Field label="Conferma nuova password">
            <Input name="confirmPassword" type="password" required minLength={8} />
          </Field>

          <Button type="submit" variant="primary" className="w-full">
            Aggiorna password
          </Button>
        </form>
      </Card>

      {isAdmin ? (
        <section className="mt-8">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-text-3">
            Gestione utenti
          </h2>
          <p className="mt-1 text-xs leading-5 text-text-3">
            Crea nuovi account, cambia i ruoli e reimposta le password di tutto
            il portale.
          </p>
          <div className="mt-3">
            <AdminPanel user={user} users={users} />
          </div>
        </section>
      ) : null}

      <p className="mt-8 text-center text-xs text-text-3">
        v{packageJson.version}
      </p>
    </main>
  );
}