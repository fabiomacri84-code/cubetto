import { expect, test } from "@playwright/test";

const email = `utente-${Date.now()}@cubetto.app`;
const password = "password123";

test("registrazione, logout e login", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();

  await expect(page.getByText("Le mie liste")).toBeVisible();

  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByText("Le mie liste")).toBeVisible();
});

test("password errata mostra l'errore", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password-sbagliata");
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page.getByText("Email o password non corretti.")).toBeVisible();
});

test("cambio password dalle impostazioni", async ({ page }) => {
  const changeEmail = `cambio-${Date.now()}@cubetto.app`;
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(changeEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();

  await expect(page.getByText("Le mie liste")).toBeVisible();
  await page.goto("/settings");
  await page.getByLabel("Password attuale", { exact: true }).fill(password);
  await page.getByLabel("Nuova password", { exact: true }).fill("nuova-password-123");
  await page.getByLabel("Conferma nuova password", { exact: true }).fill("nuova-password-123");
  await page.getByRole("button", { name: "Aggiorna password" }).click();

  await expect(page.getByText("Password aggiornata.")).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Esci" }).click();
  await page.getByLabel("Email o nome utente", { exact: true }).fill(changeEmail);
  await page.getByLabel("Password").fill("nuova-password-123");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByText("Le mie liste")).toBeVisible();
});