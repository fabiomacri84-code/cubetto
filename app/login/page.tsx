import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../auth";
import { login } from "../auth-actions";
import { prisma } from "../db";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    redirect("/setup");
  }

  const { error } = await searchParams;
  const errorMessage =
    error === "invalid" ? "Email o password non corretti." : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 pb-16 pt-[max(3.5rem,env(safe-area-inset-top))] sm:pt-20">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-soft text-3xl"
            aria-hidden
          >
            🧳
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text">
            Cubetto
          </h1>
          <p className="mt-1 text-sm text-text-3">
            Liste e pack per spesa e valigia.
          </p>
        </div>

        <div className="card mt-8 p-6">
          <h2 className="text-lg font-bold text-text">Accedi</h2>
          <form action={login} className="mt-4 flex flex-col gap-4">
            {errorMessage ? (
              <p className="rounded-xl border border-negative/30 bg-negative-soft px-3 py-2 text-sm text-negative">
                {errorMessage}
              </p>
            ) : null}

            <Field label="Email o nome utente">
              <Input name="email" type="text" required autoFocus autoComplete="username" />
            </Field>

            <Field label="Password">
              <Input name="password" type="password" required autoComplete="current-password" />
            </Field>

            <Button type="submit" variant="primary" className="mt-1 w-full">
              Entra
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-text-3">
          Non hai un account?{" "}
          <Link href="/register" className="font-semibold text-accent-strong">
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}