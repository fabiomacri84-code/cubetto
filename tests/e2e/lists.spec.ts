import { expect, test } from "@playwright/test";

test.use({ storageState: undefined });

test("crea lista, aggiunge elementi e spunta (rosso → blu)", async ({ page }) => {
  const email = `lista-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Lista Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Spesa del sabato");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await expect(page.getByRole("heading", { name: "Spesa del sabato" })).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Mele");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Mele" })).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Banane");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();

  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Mele" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Banane" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Da fare" })).toBeVisible();

  await page.getByRole("button", { name: "Fatto" }).first().click();
  await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();

  await page.getByRole("button", { name: "Da rifare" }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).first()).toBeVisible();
});

test("quantità e inserimento pack", async ({ page }) => {
  const email = `pack-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Pack Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuovo pack").click();
  await page.getByPlaceholder("es. Valigia estate").fill("Kit bagno test");
  await page.getByRole("button", { name: "Crea pack" }).click();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Spazzolino");
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
  await page.getByLabel("Nome", { exact: true }).fill("Svuota Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Lista svuota test");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Mele");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Mele" })).toBeVisible();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Banane");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Banane" })).toBeVisible();

  await page.getByRole("button", { name: "Fatto" }).first().click();
  await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();

  await page.getByRole("button", { name: "Svuota" }).click();

  await expect(page.getByRole("heading", { name: "Fatto" })).not.toBeVisible();
  await expect(page.getByText("Niente da fare")).toBeVisible();

  await page.getByText("Cassetto").click();
  await expect(page.locator("li").filter({ hasText: "Mele" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: "Banane" })).toBeVisible();

  await page.getByRole("button", { name: "Riprendi" }).first().click();
  await expect(page.locator("li").filter({ hasText: "Mele" })).toBeVisible();
  await expect(page.getByText("Niente da fare")).not.toBeVisible();
});

test("cambia immagine di un item dal tile: icona e foto", async ({ page }) => {
  const email = `img-${Date.now()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Img Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Lista immagini test");
  await page.getByRole("button", { name: "Crea lista" }).click();

  await page.getByText("Aggiungi elemento").click();
  await page.getByLabel("Nome", { exact: true }).fill("Mele");
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fatto" }).filter({ hasText: "Mele" })).toBeVisible();

  const tile = page.locator("li").filter({ hasText: "Mele" }).first();
  const editorButton = page.getByRole("button", { name: "Cambia immagine di Mele" });
  await expect(editorButton).toBeVisible();
  await editorButton.click();

  const dialog = page.getByRole("dialog", { name: "Cambia immagine" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Scatta o scegli una foto")).toBeVisible();
  await expect(dialog.getByText(/Oppure scegli un'icona/)).toBeVisible();

  const iconBefore = await tile.locator("img").first().getAttribute("src");
  await dialog.locator("button[type='button']").nth(2).click();
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).not.toHaveAttribute(
    "src",
    iconBefore ?? "",
  );

  await editorButton.click();
  await expect(dialog).toBeVisible();
  const storedEmoji = await dialog.locator('input[name="emoji"]').inputValue();
  expect(storedEmoji).not.toBe("📦");
  await page.getByRole("button", { name: "Chiudi" }).last().click();
  await expect(dialog).not.toBeVisible();

  await editorButton.click();
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from("89504e470d0a1a0a", "hex"),
  });
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).toHaveAttribute("src", /\/api\/files\//);

  await editorButton.click();
  await expect(dialog.getByRole("button", { name: "🗑️ Rimuovi foto" })).toBeVisible();
  await dialog.getByRole("button", { name: "🗑️ Rimuovi foto" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).not.toHaveAttribute(
    "src",
    /\/api\/files\//,
  );
});