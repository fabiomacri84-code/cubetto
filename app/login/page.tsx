import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../auth";
import { login } from "../auth-actions";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";
import packageJson from "../../package.json";

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

  const { error } = await searchParams;
  const errorMessage =
    error === "invalid" ? "Email o password non corretti." : null;

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
            Accedi
          </h1>
          <p className="mt-3 text-base leading-6 text-text-2">
            Liste versatili con pack riusabili: spesa, valigia e tutto il
            resto.
          </p>
        </header>

        <Card className="mt-6">
          <form action={login}>
            {errorMessage ? (
              <p className="mb-5 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                {errorMessage}
              </p>
            ) : null}

            <Field label="Email">
              <Input name="email" type="email" required autoFocus />
            </Field>

            <div className="mt-4">
              <Field label="Password">
                <Input name="password" type="password" required minLength={8} />
              </Field>
            </div>

            <Button type="submit" variant="primary" className="mt-6 w-full">
              Entra
            </Button>
          </form>
        </Card>

        <p className="mt-5 rounded-lg border border-line bg-subtle px-4 py-3 text-sm leading-6 text-text-3">
          Non hai un account?{" "}
          <Link href="/register" className="font-semibold text-accent">
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}
