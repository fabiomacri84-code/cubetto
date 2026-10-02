/** E2E may only connect to an explicitly supplied disposable, loopback database. */
export function e2eDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.E2E_ALLOW_DISPOSABLE_DATABASE !== "1" || !env.E2E_DATABASE_URL) {
    throw new Error("E2E requires E2E_DATABASE_URL and E2E_ALLOW_DISPOSABLE_DATABASE=1 for a dedicated disposable database.");
  }
  const url = new URL(env.E2E_DATABASE_URL);
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/cubetto_(?:test|ci)(?:_[a-z0-9_]+)?$/.test(url.pathname) ||
    [...url.searchParams.keys()].some((key) => !["schema", "sslmode"].includes(key)) ||
    (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")
  ) {
    throw new Error("E2E database must use loopback and a cubetto_test/cubetto_ci database (optional unique suffix), with no connection overrides.");
  }
  return env.E2E_DATABASE_URL;
}
