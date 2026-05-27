const { layoutTree, NODE_WIDTH, NODE_HEIGHT } = require("./layoutTree.cjs");

const GROUP_COLORS = {
  ".": "#dae8fc",
  types: "#d5e8d4",
  handlers: "#fff2cc",
  providers: "#e1d5e7",
  capabilities: "#f8cecc",
  intent: "#ffe6cc",
  prompts: "#d0cee2",
};
const DEFAULT_COLOR = "#f5f5f5";

function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getColor(group) {
  return GROUP_COLORS[group.split("/")[0]] || DEFAULT_COLOR;
}

function buildNodeCells(nodes, positions) {
  let cellId = 2;
  const idMap = new Map();
  let xml = "";

  for (const node of nodes) {
    const id = cellId++;
    idMap.set(node.id, id);
    const { x, y } = positions.get(node.id);
    const color = getColor(node.group);

    xml +=
      `<mxCell id="${id}" value="${esc(node.symbol)}" ` +
      `style="rounded=1;whiteSpace=wrap;fillColor=${color};` +
      `strokeColor=#666666;fontSize=10;" vertex="1" parent="1" ` +
      `tooltip="${esc(node.sourceFile)}">` +
      `<mxGeometry x="${x}" y="${y}" width="${NODE_WIDTH}" ` +
      `height="${NODE_HEIGHT}" as="geometry"/></mxCell>\n`;
  }
  return { xml, idMap, nextId: cellId };
}

function buildEdgeCells(edges, idMap, startId) {
  let cellId = startId;
  let xml = "";

  for (const { source, target, label } of edges) {
    const sId = idMap.get(source);
    const tId = idMap.get(target);
    if (sId && tId) {
      const edgeLabel = label ? ` value="${esc(label)}"` : "";
      xml +=
        `<mxCell id="${cellId++}"${edgeLabel} ` +
        `style="edgeStyle=orthogonalEdgeStyle;rounded=1;` +
        `strokeColor=#999999;endArrow=classic;endFill=1;` +
        `exitX=0.5;exitY=1;entryX=0.5;entryY=0;` +
        `fontSize=8;fontColor=#666666;" ` +
        `edge="1" parent="1" ` +
        `source="${sId}" target="${tId}"/>\n`;
    }
  }
  return xml;
}

function canvasSize(positions) {
  let maxX = 0, maxY = 0;
  for (const { x, y } of positions.values()) {
    if (x + NODE_WIDTH > maxX) maxX = x + NODE_WIDTH;
    if (y + NODE_HEIGHT > maxY) maxY = y + NODE_HEIGHT;
  }
  return { width: maxX + 80, height: maxY + 80 };
}

function generateDrawio(tree) {
  const { positions, nodes, edges } = layoutTree(tree);
  const { xml: nodeCells, idMap, nextId } = buildNodeCells(nodes, positions);
  const edgeCells = buildEdgeCells(edges, idMap, nextId);
  const { width, height } = canvasSize(positions);

  const mx = `<mxGraphModel><root><mxCell id="0"/>` +
    `<mxCell id="1" parent="0"/>\n${nodeCells}${edgeCells}</root></mxGraphModel>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ` +
    `"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" ` +
    `height="${height}" content="${esc(mx)}">\n` +
    `<text x="20" y="20" font-family="monospace" font-size="12">` +
    `Dependency Tree (open in draw.io)</text>\n</svg>\n`;
}

module.exports = { generateDrawio };
