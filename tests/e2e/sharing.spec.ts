import { expect, test } from "@playwright/test";

test("condivisione: invito, join e sola lettura", async ({ browser }) => {
  const ownerEmail = `owner-${Date.now()}@cubetto.app`;
  const guestEmail = `guest-${Date.now()}@cubetto.app`;
  const password = "password123";

  const ownerContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const guest = await guestContext.newPage();

  try {
    await owner.goto("/register");
    await owner.getByLabel("Nome", { exact: true }).fill("Owner");
    await owner.getByLabel("Email o nome utente", { exact: true }).fill(ownerEmail);
    await owner.getByLabel("Password").fill(password);
    await owner.getByRole("button", { name: "Crea account" }).click();

    await owner.getByText("Nuova lista").click();
    await owner.getByPlaceholder("es. Spesa settimanale").fill("Lista condivisa");
    await owner.getByRole("button", { name: "Crea lista" }).click();

    await owner.getByText("Aggiungi elemento").click();
    await owner.getByLabel("Nome", { exact: true }).fill("Latte");
    await owner.getByRole("button", { name: "Aggiungi", exact: true }).click();
    await expect(owner.getByRole("button", { name: "Fatto" }).filter({ hasText: "Latte" })).toBeVisible();

    await owner.getByText("Condividi").click();
    await owner.getByRole("button", { name: "Genera codice invito" }).click();
    const code = (
      (await owner.locator("p.font-mono").textContent()) ?? ""
    ).trim().toUpperCase();

    await guest.goto("/register");
    await guest.getByLabel("Nome", { exact: true }).fill("Guest");
    await guest.getByLabel("Email o nome utente", { exact: true }).fill(guestEmail);
    await guest.getByLabel("Password").fill(password);
    await guest.getByRole("button", { name: "Crea account" }).click();

    await guest.getByPlaceholder("es. A1B2C3D4").fill(code);
    await guest.getByRole("button", { name: "Unisciti" }).click();

    await expect(guest.getByRole("heading", { name: "Lista condivisa" })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Fatto" }).filter({ hasText: "Latte" })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Fatto" })).toBeVisible();

    await owner.getByText("Gestisci").click();
    await expect(owner.locator('span[aria-label*="è online"]')).toHaveCount(2);
    await expect(guest.locator("span.bg-emerald-500")).toHaveCount(2);

    await owner.reload();
    await owner.getByText("Gestisci").click();
    await Promise.all([
      owner.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes("/lists/") && !r.url().includes("/api/"),
      ),
      owner.getByRole("button", { name: "Cambia ruolo" }).click(),
    ]);

    await guest.reload();
    await expect(guest.getByRole("button", { name: "Fatto" })).toHaveCount(0);
    await expect(guest.locator("button[aria-label='Aumenta quantità']")).toHaveCount(0);

    await owner.reload();
    await owner.getByText("Gestisci").click();
    await Promise.all([
      owner.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes("/lists/") && !r.url().includes("/api/"),
      ),
      owner.getByRole("button", { name: "Cambia ruolo" }).click(),
    ]);
    await guest.reload();
    await expect(guest.getByRole("button", { name: "Fatto" }).first()).toBeVisible();
  } finally {
    await ownerContext.close();
    await guestContext.close();
  }
});