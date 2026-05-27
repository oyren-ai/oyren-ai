const { flattenTree } = require("./flattenTree.cjs");

const NODE_WIDTH = 140;
const NODE_HEIGHT = 36;
const H_GAP = 16;
const V_GAP = 80;

/**
 * Compute subtree width (sum of children widths + gaps, or own width if leaf).
 * Mutates node by adding `_width` field.
 */
function measureWidths(node) {
  if (node.children.length === 0) {
    node._width = NODE_WIDTH;
    return;
  }
  for (const child of node.children) measureWidths(child);
  node._width =
    node.children.reduce((sum, c) => sum + c._width, 0) +
    (node.children.length - 1) * H_GAP;
}

/**
 * Assign x/y positions top-down. Parent is centered over its children.
 */
function assignPositions(node, x, depth, positions) {
  const centerX = x + node._width / 2 - NODE_WIDTH / 2;
  const y = depth * (NODE_HEIGHT + V_GAP);
  positions.set(node.id, { x: Math.round(centerX), y });

  let childX = x;
  for (const child of node.children) {
    assignPositions(child, childX, depth + 1, positions);
    childX += child._width + H_GAP;
  }
}

/**
 * Layout a tree top-down, returning positions + flat node/edge lists.
 */
function layoutTree(tree) {
  measureWidths(tree);

  const positions = new Map();
  assignPositions(tree, 0, 0, positions);

  const nodes = [];
  const edges = [];
  flattenTree(tree, nodes, edges);

  return { positions, nodes, edges };
}

module.exports = { layoutTree, NODE_WIDTH, NODE_HEIGHT };
