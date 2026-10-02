#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const REPO = "fabiomacri84-code/cubetto";
const run = (command, args, capture = false) => execFileSync(command, args, {
  stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  encoding: "utf8",
});
const git = (...args) => run("git", args, true).trim();
const fail = (message) => { throw new Error(message); };
const args = process.argv.slice(2);
const mode = args.shift();
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
try {
  if (!["prepare", "publish"].includes(mode)) fail("Usage: release.mjs prepare patch|minor | publish --notes FILE [--deploy --host SSH_HOST]");
  if (git("status", "--porcelain")) fail("The working tree must be clean (including untracked files).");
  const origin = git("remote", "get-url", "origin");
  if (!/^(https:\/\/github\.com\/|git@github\.com:)fabiomacri84-code\/cubetto(?:\.git)?$/.test(origin)) fail("origin must be the original Cubetto repository.");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) fail("Only stable SemVer versions are supported.");
  if (mode === "prepare") {
    const bump = args[0];
    if (!["patch", "minor"].includes(bump)) fail("Choose patch or minor.");
    if (!git("branch", "--show-current").startsWith("codex/")) fail("Prepare a release on a codex/ branch.");
    const [major, minor, patch] = pkg.version.split(".").map(Number);
    const version = bump === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
    const readme = readFileSync("README.md", "utf8");
    if (!/versione-\d+\.\d+\.\d+-blue/.test(readme)) fail("README version badge is missing.");
    run("npm", ["version", version, "--no-git-tag-version", "--ignore-scripts"]);
    writeFileSync("app/version.ts", `// Updated together with package.json, package-lock.json and the README badge.\nexport const APP_VERSION = "${version}";\n`);
    writeFileSync("README.md", readme.replace(/versione-\d+\.\d+\.\d+-blue/g, `versione-${version}-blue`));
    run("npm", ["ci"]);
    for (const task of ["prisma:generate", "lint", "typecheck", "test", "build"]) run("npm", ["run", task]);
    run("git", ["add", "package.json", "package-lock.json", "app/version.ts", "README.md"]);
    run("git", ["commit", "-m", `chore: prepare Cubetto ${version}`]);
    run("git", ["push", "-u", "origin", git("branch", "--show-current")]);
    console.log(`Prepared ${version}. Open/update the PR and merge only after CI passes. Then run publish on main.`);
  } else {
    const notes = option("--notes");
    if (!notes || !readFileSync(notes, "utf8").trim()) fail("A nonempty release notes file is required.");
    const host = option("--host");
    if (args.includes("--deploy") && (!host || !/^[a-zA-Z0-9_.@-]+$/.test(host) || host.startsWith("-"))) fail("--deploy requires a valid SSH host alias.");
    if (git("branch", "--show-current") !== "main") fail("Publish from main after the PR is merged.");
    run("git", ["fetch", "origin", "main", "--tags"]);
    const head = git("rev-parse", "HEAD");
    if (head !== git("rev-parse", "origin/main")) fail("Local main must equal origin/main.");
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const version = pkg.version;
    if (lock.version !== version || lock.packages[""].version !== version ||
      !readFileSync("app/version.ts", "utf8").includes(`APP_VERSION = "${version}"`) ||
      !readFileSync("README.md", "utf8").includes(`versione-${version}-blue`)) fail("Release version files are not aligned.");
    const runs = JSON.parse(run("gh", ["run", "list", "--repo", REPO, "--commit", head,
      "--workflow", "checks.yml", "--event", "push", "--json", "status,conclusion,headSha", "--limit", "1"], true));
    if (runs.length !== 1 || runs[0].status !== "completed" || runs[0].conclusion !== "success" || runs[0].headSha !== head) fail("The latest main CI run for this exact commit must pass, including E2E.");
    const tag = `v${version}`;
    const existing = git("tag", "--list", tag);
    if (existing) {
      if (git("cat-file", "-t", tag) !== "tag" || git("rev-parse", `${tag}^{commit}`) !== head) fail("Existing tag is not an annotated tag at this exact commit.");
    } else run("git", ["tag", "-a", tag, "-m", `Cubetto ${version}`, head]);
    run("git", ["push", "origin", `refs/tags/${tag}`]);
    run("gh", ["release", "create", tag, "--repo", REPO, "--verify-tag", "--title", `Cubetto ${version}`, "--notes-file", notes]);
    if (args.includes("--deploy")) {
      execFileSync("ssh", [host, "bash", "-s", "--", tag], {
        input: readFileSync("scripts/deploy-production.sh"),
        stdio: ["pipe", "inherit", "inherit"],
      });
    }
    console.log(`Published ${tag} from ${head}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
