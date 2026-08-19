import { requireUser } from "./auth";
import { logout } from "./auth-actions";
import { Button } from "./components/ui/button";
import packageJson from "../package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-6xl" aria-hidden>
        🧳
      </div>
      <h1 className="text-2xl font-bold text-text">Ciao, {user.name}!</h1>
      <p className="text-sm text-text-2">
        Le tue liste e i tuoi pack arriveranno qui a breve.
      </p>
      <form action={logout} className="mt-4">
        <Button type="submit" variant="secondary">
          Esci
        </Button>
      </form>
      <p className="mt-4 text-xs text-text-3">v{packageJson.version}</p>
    </main>
  );
}
