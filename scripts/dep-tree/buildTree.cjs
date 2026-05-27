const fs = require("fs");
const path = require("path");
const { parseImports } = require("./parseImports.cjs");
const { resolveImportPath } = require("./resolveImportPaths.cjs");

const SKIP_PATTERNS = [/_test\.ts$/, /testdata\//];

function shouldSkip(p) {
  return SKIP_PATTERNS.some((re) => re.test(p));
}

function collectTsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "testdata" || entry.name === "node_modules") continue;
      collectTsFiles(full, files);
    } else if (entry.name.endsWith(".ts") && !shouldSkip(full)) {
      files.push(full);
    }
  }
  return files;
}

function buildSymbolAdjacency(srcRoot) {
  const adj = new Map();
  for (const filePath of collectTsFiles(srcRoot)) {
    let fileId = path.relative(srcRoot, filePath);
    if (fileId.endsWith(".ts")) fileId = fileId.slice(0, -3);
    if (!adj.has(fileId)) adj.set(fileId, []);

    for (const { symbols, path: raw } of parseImports(filePath)) {
      const resolved = resolveImportPath(raw, filePath, srcRoot);
      if (!resolved || shouldSkip(resolved)) continue;
      for (const sym of symbols) {
        adj.get(fileId).push({ symbol: sym, sourceFile: resolved });
      }
    }
    adj.get(fileId).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
  return adj;
}

function getGroup(id) {
  const dir = path.dirname(id);
  return dir === "." ? "." : dir;
}

/**
 * Build a deterministic symbol-level tree via DFS from root.
 * Each sourceFile is expanded only on first encounter.
 */
function buildTree(targetDir) {
  const srcRoot = path.resolve(targetDir);
  const adj = buildSymbolAdjacency(srcRoot);

  const rootId = adj.has("index") ? "index" : Array.from(adj.keys()).sort()[0];
  const visited = new Set();

  function dfs(fileId) {
    visited.add(fileId);
    const children = [];
    for (const { symbol, sourceFile } of adj.get(fileId) || []) {
      const nodeId = `${sourceFile}::${symbol}`;
      if (!visited.has(sourceFile)) {
        const subtree = dfs(sourceFile);
        children.push({ ...subtree, id: nodeId, symbol });
      } else {
        children.push({
          id: nodeId, symbol, sourceFile, group: getGroup(sourceFile), children: [],
        });
      }
    }
    return { id: fileId, symbol: fileId.split("/").pop(), sourceFile: fileId, group: getGroup(fileId), children };
  }

  return dfs(rootId);
}

module.exports = { buildTree };
