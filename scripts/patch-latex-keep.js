/**
 * Patch latex.js .keep files so esbuild can load them (no loader for .keep otherwise).
 * Run after install (postinstall).
 */
import { writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const latexPkg = join(root, "node_modules", "latex.js", "dist");
const stub = "export default {}";

const files = [
  join(latexPkg, "documentclasses", ".keep"),
  join(latexPkg, "packages", ".keep"),
];

for (const f of files) {
  if (existsSync(f)) {
    writeFileSync(f, stub, "utf8");
    console.log("[patch-latex-keep] Patched:", f);
  }
}
