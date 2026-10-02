import { expect, test } from "@playwright/test";
import { Client } from "pg";
import path from "node:path";
import { stubImageLookup } from "./image-lookup";
import { e2eDatabaseUrl } from "./database";

test.beforeEach(async ({ page }) => { await stubImageLookup(page); });

test.use({ storageState: undefined });

test("ricerca immagine indisponibile: sceglie un’icona manuale e salva", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Immagine indisponibile");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(`immagine-${crypto.randomUUID()}@cubetto.app`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.route("**/api/icon-suggestion", async (route) => {
    await route.fulfill({ status: 503, json: { error: "Image lookup unavailable" } });
  });
  await page.getByText("Nuova lista").click();
  const sheet = page.getByRole("dialog").filter({ has: page.getByPlaceholder("es. Spesa settimanale") });
  await sheet.getByPlaceholder("es. Spesa settimanale").fill("Oggetto ignoto QZRT");
  await expect(sheet.getByRole("progressbar", { name: "Ricerca icone" })).toBeVisible();
  await expect(sheet.getByRole("status")).toHaveText("Ricerca non disponibile. Puoi scegliere un’icona a mano.");
  await expect(sheet.getByRole("progressbar")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Scegli icona", exact: true }).click();
  await page.getByRole("dialog", { name: "Scegli icona", exact: true }).getByRole("button", { name: "Regalo", exact: true }).click();
  await expect(sheet.locator('input[name="emoji"]')).toHaveValue("🎁");
  await expect(sheet.getByRole("status")).toHaveText("Icona scelta da te.");
  await sheet.getByRole("button", { name: "Crea lista" }).click();
  await expect(page.getByRole("heading", { name: "Oggetto ignoto QZRT", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Oggetto ignoto QZRT", exact: true })).toBeVisible();
});

test("crea lista, aggiunge elementi e spunta (rosso → blu)", async ({ page }) => {
  const email = `lista-${crypto.randomUUID()}@cubetto.app`;

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
  const email = `pack-${crypto.randomUUID()}@cubetto.app`;

  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Pack Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();

  await page.locator("summary").filter({ hasText: "I tuoi pack" }).click();
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
  const email = `svuota-${crypto.randomUUID()}@cubetto.app`;

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

  // Photo credits must fit within the tile without covering the drawer action.
  // Modify only this test's freshly created item on the guarded disposable database.
  const listPath = new URL(page.url()).pathname.split("/");
  expect(listPath[1]).toBe("lists");
  const listId = listPath[2];
  expect(listId).toBeTruthy();
  const database = new Client({ connectionString: e2eDatabaseUrl() });
  try {
    await database.connect();
    const updated = await database.query(
      'UPDATE "Item" SET "imageUrl" = $1, "imageAttribution" = $2, "imageSourceUrl" = $3 WHERE "listId" = $4 AND "name" = $5',
      ["/pwa-icon-192.png", "Fotografo · CC0", "https://commons.wikimedia.org/wiki/File:Test.jpg", listId, "Mele"],
    );
    expect(updated.rowCount).toBe(1);
  } finally {
    await database.end();
  }
  await page.reload();
  await expect(page.getByText("Foto: Fotografo · CC0 · Wikimedia Commons")).toBeVisible();

  await page.getByRole("button", { name: "Fatto" }).first().click();
  await expect(page.getByRole("heading", { name: "Fatto" })).toBeVisible();

  await page.getByRole("button", { name: "Svuota" }).click();

  await expect(page.getByRole("heading", { name: "Fatto" })).not.toBeVisible();
  await expect(page.getByText("Niente da fare")).toBeVisible();

  await page.locator("summary").filter({ hasText: "Cassetto" }).click();
  await expect(page.locator("li").filter({ hasText: "Mele" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: "Banane" })).toBeVisible();

  await page.getByRole("button", { name: "Riprendi Mele", exact: true }).click();
  await expect(page.locator("li").filter({ hasText: "Mele" })).toBeVisible();
  await expect(page.getByText("Niente da fare")).not.toBeVisible();
});

test("cambia immagine di un item dal tile: icona e foto", async ({ page }) => {
  const email = `img-${crypto.randomUUID()}@cubetto.app`;

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
  const editorButton = page.getByRole("button", { name: "Modifica Mele" });
  await expect(editorButton).toBeVisible();
  await editorButton.click();

  const dialog = page.getByRole("dialog", { name: "Modifica Mele" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Scatta o scegli una foto")).toBeVisible();
  await expect(dialog.getByText(/Oppure scegli un'icona/)).toBeVisible();

  const iconBefore = await tile.locator("img").first().getAttribute("src");
  // Click an icon from the grid (second icon, first is default)
  await dialog.locator("div[class*='grid'] button").nth(1).click();
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).not.toHaveAttribute(
    "src",
    iconBefore ?? "",
  );

  await editorButton.click();
  await expect(dialog).toBeVisible();
  const storedEmoji = await dialog.locator('input[name="emoji"]').first().inputValue();
  expect(storedEmoji).not.toBe("📦");
  await page.getByRole("button", { name: "Chiudi" }).last().click();
  await expect(dialog).not.toBeVisible();

  await editorButton.click();
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles(path.resolve(__dirname, "../fixtures/pixel.png"));
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).toHaveAttribute("src", /\/api\/files\//);

  await editorButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "🗑️ Rimuovi foto" })).toBeVisible();
  await dialog.getByRole("button", { name: "🗑️ Rimuovi foto" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(tile.locator("img").first()).not.toHaveAttribute(
    "src",
    /\/api\/files\//,
  );
});
test("icone automatiche, scelta manuale e nessuna categoria nei moduli lista e pack", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Icone Test");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(`icone-${crypto.randomUUID()}@cubetto.app`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();
  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Lista icone");
  await page.getByRole("button", { name: "Crea lista" }).click();
  await page.getByText("Aggiungi elemento").click();
  const sheet = page.getByRole("dialog").filter({ has: page.getByLabel("Nome", { exact: true }) });
  await expect(sheet.locator('[name="categoryId"]')).toHaveCount(0);
  await expect(sheet.getByLabel("Categoria", { exact: true })).toHaveCount(0);
  await sheet.getByLabel("Nome", { exact: true }).fill("Spazzolino");
  await expect(sheet.getByRole("progressbar")).toHaveCount(0);
  await expect(sheet.getByRole("status")).toHaveText("Icona trovata nel set offline.");
  await expect(sheet.getByRole("button", { name: "Scegli icona", exact: true })).toBeEnabled();
  await expect(sheet.locator('input[name="emoji"]')).toHaveValue("🪥");
  await sheet.getByRole("button", { name: "Scegli icona", exact: true }).click();
  await page.getByRole("dialog", { name: "Scegli icona", exact: true }).getByRole("button", { name: "Regalo", exact: true }).click();
  await expect(sheet.locator('input[name="emoji"]')).toHaveValue("🎁");
  await expect(sheet.getByRole("progressbar")).toHaveCount(0);
  await expect(sheet.getByRole("status")).toHaveText("Icona scelta da te.");
  await sheet.getByLabel("Nome", { exact: true }).fill("Latte");
  // A recognized new name must not replace a deliberately selected icon.
  await page.waitForTimeout(700);
  await expect(sheet.locator('input[name="emoji"]')).toHaveValue("🎁");
  await sheet.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await page.getByRole("button", { name: "Modifica Latte", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Modifica Latte" }).locator('input[name="emoji"]').first()).toHaveValue("🎁");
  await page.getByRole("dialog", { name: "Modifica Latte" }).getByRole("button", { name: "Chiudi", exact: true }).last().click();

  await page.goto("/");
  await page.locator("summary").filter({ hasText: "I tuoi pack" }).click();
  await page.getByText("Nuovo pack").click();
  await page.getByPlaceholder("es. Valigia estate").fill("Pack icone");
  await page.getByRole("button", { name: "Crea pack" }).click();
  await page.getByText("Aggiungi elemento").click();
  await expect(sheet.locator('[name="categoryId"]')).toHaveCount(0);
  await sheet.getByLabel("Nome", { exact: true }).fill("Latte");
  await expect(sheet.locator('input[name="emoji"]')).toHaveValue("🥛");
  await sheet.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await page.getByRole("button", { name: "Modifica Latte", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Modifica Latte" }).locator('input[name="emoji"]').first()).toHaveValue("🥛");
});

test("seleziona un’icona online per oggetti esistenti in lista e pack", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome", { exact: true }).fill("Icone online");
  await page.getByLabel("Email o nome utente", { exact: true }).fill(`online-${crypto.randomUUID()}@cubetto.app`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Crea account" }).click();
  await page.getByText("Nuova lista").click();
  await page.getByPlaceholder("es. Spesa settimanale").fill("Spesa");
  await page.getByRole("button", { name: "Crea lista" }).click();
  for (const kind of ["list", "pack"]) {
    if (kind === "pack") {
      await page.goto("/");
      await page.locator("summary").filter({ hasText: "I tuoi pack" }).click();
      await page.getByText("Nuovo pack").click();
      await page.getByPlaceholder("es. Valigia estate").fill("Valigia");
      await page.getByRole("button", { name: "Crea pack" }).click();
    }
    await page.getByText("Aggiungi elemento").click();
    await page.getByLabel("Nome", { exact: true }).fill("occhiali");
    await expect(page.getByRole("status")).toHaveText("Icona trovata nel set offline.");
    await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
    await page.getByRole("button", { name: "Modifica occhiali", exact: true }).click();
    await page.route("**/api/icon-suggestion", async (route) => route.fulfill({ json: { emoji: "👓", options: [{emoji:"👓",photoTitle:"Iconify:lucide:glasses",imageUrl:"https://api.iconify.design/lucide/glasses.svg",attribution:"Lucide · ISC",sourceUrl:"https://icon-sets.iconify.design/lucide/glasses/"}] } }));
    const editor = page.getByRole("dialog", { name: "Modifica occhiali", exact: true });
    await editor.getByRole("button", { name: "Cerca icone online", exact: true }).click();
    await editor.getByRole("button", { name: "Scegli icona online 1" }).click();
    await expect(editor).toHaveCount(0);
    await page.reload();
    await expect(page.locator('img[src="https://api.iconify.design/lucide/glasses.svg"]')).toBeVisible();
  }
});
