import { execFileSync } from "node:child_process";
import path from "node:path";
import { e2eDatabaseUrl } from "./database";

// Executed before the web server: no reset and no implicit use of the developer .env.
const root = path.resolve(__dirname, "../..");
const env = { ...process.env, DATABASE_URL: e2eDatabaseUrl() };
execFileSync("npx", ["prisma", "migrate", "deploy"], { cwd: root, stdio: "inherit", env });
execFileSync("npm", ["run", "seed"], { cwd: root, stdio: "inherit", env });
