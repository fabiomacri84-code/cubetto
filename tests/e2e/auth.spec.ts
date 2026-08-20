import { expect, test } from "@playwright/test";

const email = `utente-${Date.now()}@cubetto.app`;
const password = "password123";

test("registrazione, logout e login", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();

  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();

  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();
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

  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();
});

test("setup reindirizza al login quando ci sono già utenti", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();
});

test("l'admin gestisce le utenze", async ({ page }) => {
  const adminName = `Admin ${Date.now()}`;
  const adminEmail = `admin-${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("Email o nome utente", { exact: true }).fill("fabio");
  await page.getByLabel("Password").fill("cubetto");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();

  await page.getByRole("link", { name: "Amministrazione" }).click();
  await expect(page.getByRole("heading", { name: "Amministrazione" })).toBeVisible();

  const createForm = page.locator("form").first();
  await createForm.getByLabel("Nome", { exact: true }).fill(adminName);
  await createForm.getByLabel("Nome utente", { exact: true }).fill(adminEmail);
  await createForm.getByLabel("Password").fill("password-admin");
  await createForm.getByLabel("Ruolo").selectOption("admin");
  await createForm.getByRole("button", { name: "Crea utente" }).click();

  await expect(page.getByText(adminName)).toBeVisible();
  await expect(page.getByText(adminEmail)).toBeVisible();

  const row = page.locator("li").filter({ hasText: adminName });
  await row.getByLabel("Ruolo di " + adminName).selectOption("user");
  await row.getByRole("button", { name: "Salva" }).click();

  await expect(row.locator("span").filter({ hasText: /^Utente$/ })).toBeVisible();

  const newPass = "password-nuova-123";
  await row.getByLabel(`Nuova password per ${adminName}`).fill(newPass);
  await row.getByRole("button", { name: "Reimposta" }).click();

  await page.getByRole("link", { name: "Torna alla home" }).click();
  await page.getByRole("button", { name: "Esci" }).click();

  await page.getByLabel("Email o nome utente", { exact: true }).fill(adminEmail);
  await page.getByLabel("Password").fill(newPass);
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByRole("heading", { name: "Le mie liste" })).toBeVisible();
});