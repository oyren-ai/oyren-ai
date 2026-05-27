const fs = require("fs");

const INTERNAL_PREFIXES = ["@/", "./", "../"];
const TYPE_IMPORT_RE = /import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]/g;
const NAMED_IMPORT_RE = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const DEFAULT_IMPORT_RE = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/gm;

function isInternalImport(importPath) {
  return INTERNAL_PREFIXES.some((prefix) => importPath.startsWith(prefix));
}

function extractSymbolsFromBraces(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("type "))
    .map((s) => (s.includes(" as ") ? s.split(" as ")[1].trim() : s));
}

/**
 * Extract internal import paths with their symbol names.
 * Returns { symbols: string[], path: string }[].
 * Type-only imports are excluded.
 */
function parseImports(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const content = raw.replace(TYPE_IMPORT_RE, "");
  const results = [];
  const seen = new Set();

  let m;
  while ((m = NAMED_IMPORT_RE.exec(content)) !== null) {
    const symbols = extractSymbolsFromBraces(m[1]);
    const importPath = m[2];
    if (symbols.length && isInternalImport(importPath) && !seen.has(importPath)) {
      seen.add(importPath);
      results.push({ symbols, path: importPath });
    }
  }

  while ((m = DEFAULT_IMPORT_RE.exec(content)) !== null) {
    const symbolName = m[1];
    const importPath = m[2];
    if (symbolName !== "type" && isInternalImport(importPath) && !seen.has(importPath)) {
      seen.add(importPath);
      results.push({ symbols: [symbolName], path: importPath });
    }
  }

  return results;
}

module.exports = { parseImports };
