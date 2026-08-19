import { expect, test } from "@playwright/test";

test.use({ storageState: undefined });

test("crea lista, aggiunge elementi e spunta (rosso → blu)", async ({ page }) => {
  const email = `lista-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Lista Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Spesa del sabato");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await expect(page.getByRole("heading", { name: "Spesa del sabato" })).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome").fill("Mele");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByText("Mele")).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome").fill("Banane");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();

  const row = page.getByText("Mele");
  await expect(row).toBeVisible();
  await expect(page.getByText("Banane")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Da fare" })).toBeVisible();

  await page.getByRole("button", { name: "Fatto" }).first().click();
  await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();

  await page.getByRole("button", { name: "Da rifare" }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).first()).toBeVisible();
});

test("quantità e inserimento pack", async ({ page }) => {
  const email = `pack-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Pack Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuovo pack").click();
  await page.getByPlaceholder("es. Valigia estate").fill("Kit bagno test");
  await page.getByRole("button", { name: "Crea pack" }).click();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome").fill("Spazzolino");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByText("Spazzolino")).toBeVisible();

  await page.goto("/");
  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Valigia test");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await page.getByText("Aggiungi pack").click();
  await page.getByRole("button", { name: /Kit bagno test/ }).click();
  await expect(page.getByText("Spazzolino")).toBeVisible();
});

test("svuota la lista nel cassetto e riprende gli item", async ({ page }) => {
  const email = `svuota-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Svuota Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Lista svuota test");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome").fill("Mele");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByText("Mele")).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome").fill("Banane");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByText("Banane")).toBeVisible();

  await page.getByRole("button", { name: "Fatto" }).first().click();
  await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();

  await page.getByRole("button", { name: "Svuota" }).click();

  await expect(page.getByRole("heading", { name: "Fatto" })).not.toBeVisible();
  await expect(page.getByText("Niente da fare")).toBeVisible();

  await page.getByText("Cassetto").click();
  await expect(page.getByText("Mele")).toBeVisible();
  await expect(page.getByText("Banane")).toBeVisible();

  await page.getByRole("button", { name: "Riprendi" }).first().click();
  await expect(page.getByText("Mele")).toBeVisible();
  await expect(page.getByText("Niente da fare")).not.toBeVisible();
});