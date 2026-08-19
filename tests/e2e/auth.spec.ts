import { expect, test } from "@playwright/test";

const email = `utente-${Date.now()}@cubetto.app`;
const password = "password123";

test("registrazione, logout e login", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();

  await expect(page.getByText("Le mie liste")).toBeVisible();

  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByText("Le mie liste")).toBeVisible();
});

test("password errata mostra l'errore", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password-sbagliata");
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page.getByText("Email o password non corretti.")).toBeVisible();
});