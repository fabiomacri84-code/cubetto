import { describe, expect, it } from "vitest";
import { normalizeEmail } from "../../app/lib/auth-core";
import { hashPassword, verifyPassword } from "../../app/lib/auth-core";

describe("normalizeEmail", () => {
  it("normalizza maiuscole e spazi", () => {
    expect(normalizeEmail("  Demo@Cubetto.APP ")).toBe("demo@cubetto.app");
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifica la password corretta e rifiuta quella sbagliata", () => {
    const hash = hashPassword("demo1234");

    expect(verifyPassword("demo1234", hash)).toBe(true);
    expect(verifyPassword("sbagliata", hash)).toBe(false);
  });
});