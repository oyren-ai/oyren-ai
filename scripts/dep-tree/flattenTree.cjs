/**
 * Flatten a tree into {nodes, edges} lists for the renderer.
 * Each edge is labeled with the child's symbol name.
 */
function flattenTree(node, nodes, edges) {
  nodes.push({ id: node.id, group: node.group, symbol: node.symbol, sourceFile: node.sourceFile });
  for (const child of node.children) {
    edges.push({
      source: node.id,
      target: child.id,
      label: child.symbol,
    });
    flattenTree(child, nodes, edges);
  }
}

module.exports = { flattenTree };
