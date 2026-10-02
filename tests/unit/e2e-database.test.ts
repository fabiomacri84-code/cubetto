import { describe, expect, it } from "vitest";
import { e2eDatabaseUrl } from "../e2e/database";

const allowed = (url: string) => ({ E2E_DATABASE_URL: url, E2E_ALLOW_DISPOSABLE_DATABASE: "1" });

describe("E2E database isolation", () => {
  it("requires explicit disposable opt-in and never falls back to DATABASE_URL", () => {
    expect(() => e2eDatabaseUrl({ DATABASE_URL: "postgresql://localhost/cubetto" })).toThrow();
    expect(() => e2eDatabaseUrl({ E2E_DATABASE_URL: "postgresql://localhost/cubetto_test" })).toThrow();
  });
  it("accepts dedicated local databases including unique run suffixes", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      for (const name of ["cubetto_ci", "cubetto_test", "cubetto_test_codex_20261002"]) {
        const url = `postgresql://test:example@${host}:15433/${name}?schema=public`;
        expect(e2eDatabaseUrl(allowed(url))).toBe(url);
      }
    }
  });
  it("rejects normal databases, remote hosts and query connection overrides", () => {
    for (const url of [
      "postgresql://127.0.0.1/cubetto",
      "postgresql://192.168.0.146/cubetto_test",
      "postgresql://localhost/cubetto_ci?host=192.168.0.146",
      "postgresql://localhost/cubetto_test?schema=production",
      "postgresql://localhost/cubetto_test?dbname=cubetto",
      "file:///cubetto_test",
    ]) expect(() => e2eDatabaseUrl(allowed(url))).toThrow();
  });
});
