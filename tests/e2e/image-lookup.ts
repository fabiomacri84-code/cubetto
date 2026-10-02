import type { Page } from "@playwright/test";

// External Wikimedia is verified separately by provider tests and live smoke.
// Browser tests keep real auth/data actions while controlling network outcomes.
export async function stubImageLookup(page: Page) {
  await page.route("**/api/icon-suggestion", async (route) => {
    await route.fulfill({ status: 200, json: { emoji: "📦" } });
  });
}
