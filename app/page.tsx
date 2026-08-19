import packageJson from "../package.json";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-6xl" aria-hidden>
        🧳
      </div>
      <h1 className="text-2xl font-bold text-text">Cubetto</h1>
      <p className="text-sm text-text-2">
        Liste versatili con pack riusabili: spesa, valigia e tutto il resto.
      </p>
      <p className="mt-4 text-xs text-text-3">v{packageJson.version} — work in progress</p>
    </main>
  );
}
