import { execSync } from "node:child_process";
import path from "node:path";

process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = "Sì, resetta il DB";

export default function globalSetup() {
  const root = path.resolve(__dirname, "../..");
  execSync("npx prisma migrate reset --force", {
    cwd: root,
    stdio: "inherit",
  });
  execSync("npm run seed", { cwd: root, stdio: "inherit" });
}