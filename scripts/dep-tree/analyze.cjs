const fs = require("fs");
const path = require("path");
const { buildTree } = require("./buildTree.cjs");
const { generateDrawio } = require("./generateDrawio.cjs");

const args = process.argv.slice(2);
const outputIdx = args.indexOf("--output");
const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : ".";
const targetFolder = args.find((a) => !a.startsWith("--") && a !== outputDir);

if (!targetFolder) {
  console.error("Usage: node analyze.cjs <target-folder> [--output <dir>]");
  process.exit(1);
}

const resolvedTarget = path.resolve(targetFolder);
const resolvedOutput = path.resolve(outputDir);

if (!fs.existsSync(resolvedTarget)) {
  console.error(`Target folder not found: ${resolvedTarget}`);
  process.exit(1);
}

fs.mkdirSync(resolvedOutput, { recursive: true });

const tree = buildTree(resolvedTarget);
const jsonPath = path.join(resolvedOutput, "dep-graph.json");
fs.writeFileSync(jsonPath, JSON.stringify(tree, null, 2));
console.log(`Wrote tree -> ${jsonPath}`);

const svg = generateDrawio(tree);
const svgPath = path.join(resolvedOutput, "dep-graph.drawio.svg");
fs.writeFileSync(svgPath, svg);
console.log(`Wrote diagram -> ${svgPath}`);
