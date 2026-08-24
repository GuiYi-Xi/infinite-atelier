// Builds the embedded MONOFORM director studio (web/monoform-studio) and syncs its dist
// into web/public/monoform, so the canvas app is fully self-contained and does not depend
// on the external white-model animation project. Run: npm run build:monoform
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const studio = join(root, "monoform-studio");
const dist = join(studio, "dist");
const target = join(root, "public", "monoform");

if (!existsSync(join(studio, "node_modules"))) {
    console.log("[monoform] installing studio dependencies...");
    execSync("npm install", { cwd: studio, stdio: "inherit" });
}

console.log("[monoform] building studio...");
execSync("npm run build", { cwd: studio, stdio: "inherit" });

// Sync only the rebuilt entry and assets; models/branding stay in place.
// Overwrite in place without deleting: on some platforms (or with trash hooks) removing the old
// bundle can be blocked and end up leaving the target empty. Outdated hashed files are harmless.
cpSync(join(dist, "assets"), join(target, "assets"), { recursive: true });
cpSync(join(dist, "index.html"), join(target, "index.html"));
console.log(`[monoform] synced dist -> ${target}`);
