/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  nc-utils

  General purpose utilities for manipulating NCDATA.
  Used by both nc-logic and importexport-logic.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/**
 * Calculates and sets `degrees` for all nodes
 * `degrees` is the number of edges connected to a node
 * degrees needs to be recalculated whenever an edge is changed
 * This modifies `data`
 * @param {object} data
 * @param {array} data.nodes
 * @param {array} data.edges
 */
export function RecalculateAllNodeDegrees(data) {
  const degrees = new Map();
  function inc(nodeId) {
    const val = degrees.get(nodeId) || 0;
    degrees.set(nodeId, val + 1);
  }
  // Count edges efficiently
  data.edges.forEach(e => {
    inc(e.source);
    inc(e.target);
  });
  // Apply the sums
  data.nodes.forEach(n => {
    n.degrees = degrees.get(n.id) || 0;
  });
}

/**
 * Calculates and sets `size` for all edges
 * `size` is the sum of all edge weights that have the same source/targets
 * By default `weight` is 1.
 * @param {object} data
 * @param {array} data.nodes
 * @param {array} data.edges
 */
export function RecalculateAllEdgeSizes(data) {
  const size = new Map();
  function getKey(sourceId, targetId) {
    // key always starts with the smaller value
    return sourceId<targetId ? `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
  }
  function inc(weight, sourceId, targetId) {
    const w = weight || 1;
    const key = getKey(sourceId, targetId);
    const val = size.get(key) || 0;
    size.set(key, val + w);
  }
  // Count edges efficiently
  data.edges.forEach(e => {
    inc(e.weight, e.source, e.target);
  });
  // Apply the sums
  data.edges.forEach(e => {
    const key = getKey(e.source, e.target);
    e.size = size.get(key) || 1;
  });
}

