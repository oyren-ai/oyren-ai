const path = require("path");
const fs = require("fs");

const TS_EXTENSIONS = [".ts", ".tsx"];

/**
 * Try resolving a module path to an actual file.
 * Handles: exact match, .ts appended, /index.ts appended.
 */
function findActualFile(absPath) {
  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
    return absPath;
  }
  for (const ext of TS_EXTENSIONS) {
    const withExt = absPath + ext;
    if (fs.existsSync(withExt)) return withExt;
  }
  const indexFile = path.join(absPath, "index.ts");
  if (fs.existsSync(indexFile)) return indexFile;
  return null;
}

/**
 * Resolve a single import path to a canonical module ID (relative to srcRoot).
 *
 * @param {string} importPath - Raw import string (e.g. "@/types/ChatResponse.ts")
 * @param {string} importerAbsPath - Absolute path of the importing file
 * @param {string} srcRoot - Absolute path of the target src folder
 * @returns {string|null} Canonical module ID or null if unresolvable
 */
function resolveImportPath(importPath, importerAbsPath, srcRoot) {
  let absPath;

  if (importPath.startsWith("@/")) {
    const stripped = importPath.slice(2);
    absPath = path.join(srcRoot, stripped);
  } else {
    const importerDir = path.dirname(importerAbsPath);
    absPath = path.resolve(importerDir, importPath);
  }

  // Strip .ts/.tsx extension if present on the import itself
  for (const ext of TS_EXTENSIONS) {
    if (absPath.endsWith(ext)) {
      absPath = absPath.slice(0, -ext.length);
      break;
    }
  }

  const actual = findActualFile(absPath) || findActualFile(absPath);
  if (!actual) return null;

  // Return path relative to srcRoot, without extension
  let relative = path.relative(srcRoot, actual);
  for (const ext of TS_EXTENSIONS) {
    if (relative.endsWith(ext)) {
      relative = relative.slice(0, -ext.length);
      break;
    }
  }
  return relative;
}

module.exports = { resolveImportPath };
