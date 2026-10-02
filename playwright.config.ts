import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl } from "./tests/e2e/database";

const databaseUrl = e2eDatabaseUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx tsx tests/e2e/global-setup.ts && npx next ${process.env.CI ? "start" : "dev"} -p 3100`,
    env: { DATABASE_URL: databaseUrl, AUTH_SECURE_COOKIES: "false" },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
