import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../auth";
import { register } from "../auth-actions";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";
import packageJson from "../../package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  const { error } = await searchParams;
  const errorMessage =
    error === "email-exists"
      ? "Esiste già un account con questa email."
      : null;

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 pb-16 pt-14 sm:pt-20">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-text">
            <span aria-hidden>🧳</span> Cubetto
          </span>
          <span className="tnum text-xs text-text-3">
            v{packageJson.version}
          </span>
        </div>

        <header className="mt-10">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Crea il tuo account
          </h1>
          <p className="mt-3 text-base leading-6 text-text-2">
            Serve per condividere liste e pack con chi vuoi tu.
          </p>
        </header>

        <Card className="mt-6">
          <form action={register}>
            {errorMessage ? (
              <p className="mb-5 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                {errorMessage}
              </p>
            ) : null}

            <Field label="Nome">
              <Input name="name" type="text" required autoFocus />
            </Field>

            <div className="mt-4">
              <Field label="Email">
                <Input name="email" type="email" required />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Password" hint="Almeno 8 caratteri.">
                <Input name="password" type="password" required minLength={8} />
              </Field>
            </div>

            <Button type="submit" variant="primary" className="mt-6 w-full">
              Crea account
            </Button>
          </form>
        </Card>

        <p className="mt-5 rounded-lg border border-line bg-subtle px-4 py-3 text-sm leading-6 text-text-3">
          Hai già un account?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}
