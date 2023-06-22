/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RENDER LOGIC

  render-logic handles the transformation of NCDATA (and it's subvariants
  FILTEREDD3DATA and SYNTHESIZEDDATA) into `d3data` format that can be
  rendered by NCGraphRenderer.

  It is loaded directly by NCGraph for processing.  In this way,
  multiple renderers can be supported via separate  NCGraph components.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require("unisys/client");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = "render-logic: ";

/// MODULE DATA ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let D3DATA = {};

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  // Register any handlers?
  // Probably not needed as NCGraph handles most events and uses this
  // module as utility methods.
}); // end UNISYS_INIT


/// MODULE PUBLIC METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Interprets SYNTEHSIZEDD3DATA into a simplified form for the renderer
 * @param {*} data NCDATA { nodes, edges }
 * @returns {Object} {
 *                     nodes: [ ...{id, label, size, color, opacity, strokeColor, strokeWidth, help}],
 *                     edges: [ ...{id, sourceId, targetId, size, color, opacity}]
 *                   }
 */
MOD.ProcessNCData = data => {
  if (DBG) console.log('ProcessNCData')
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const COLORMAP = UDATA.AppState('COLORMAP');
  const nodes = data.nodes.map(n => {
    // FIXME: Just copy over relevant attributes, don't copy the whole object!!!!
    n.color = COLORMAP.nodeColorMap[n.type];
    n.opacity = n.filteredTransparency;
    n.size = Math.min(TEMPLATE.nodeSizeDefault + n.degrees, TEMPLATE.nodeSizeMax);
    n.strokeColor = n.selected || n.strokeColor || undefined;
    n.strokeWidth = n.selected || n.strokeColor ? '5px' : undefined;
    n.help = m_GetHelp(n);
    return n;
  })
  const edges = m_UpdateEdges(data.edges);
  D3DATA.nodes = nodes;
  D3DATA.edges = edges;
  return D3DATA;
}

MOD.SetNCData = data => {
  D3DATA = data;
}

MOD.UpdateSelection = data => {
  const edges = m_UpdateEdges(D3DATA.edges);
  D3DATA.edges = edges;
  return D3DATA;
}

/// MODULE PRIVATE METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UpdateEdges(edges) {
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const SELECTION = UDATA.AppState('SELECTION');
  const { mouseOverNodeId } = SELECTION;
  return edges.map(e => {
    // FIXME: Just copy over relevant attributes, don't copy the whole object!!!!
    // width -- show full width unless mouse is over a node, in which case, do not show weight
    //          size and max size checking was completed in edge-logic
    const sourceId = typeof e.source === 'number' ? e.source : e.source.id;
    const targetId = typeof e.target === 'number' ? e.target : e.target.id;
    if (e.selected ||
      (mouseOverNodeId === undefined) || // no mouseover
      (sourceId === mouseOverNodeId) ||  // mouseover the source
      (targetId === mouseOverNodeId)     // or target
    ) {
      // leave size alone, max size checking is in edge-logic
      e.width = e.size;
      e.opacity = e.filteredTransparency;
    } else {
      e.width = TEMPLATE.edgeSizeDefault; // mouse over a node, so just show thin line
      e.opacity = TEMPLATE.edgeDefaultTransparency; // lighten
    }
    // opacity
    return e;
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns the tooltip help text for the node, using labels defined in the template
 * @param {*} node
 * @returns {string}
 */
function m_GetHelp(node) {
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const nodeDefs = TEMPLATE.nodeDefs;
  let titleText = "";
  if (nodeDefs.label.includeInGraphTooltip !== undefined) {
    // Add Label
    if (nodeDefs.label.includeInGraphTooltip) titleText += nodeDefs.label.displayLabel + ": " + node.label + "\n";
    // Add type
    if (nodeDefs.type.includeInGraphTooltip) titleText += nodeDefs.type.displayLabel + ": " + node.type + "\n";
    // Add degrees
    if (nodeDefs.degrees.includeInGraphTooltip) titleText += nodeDefs.degrees.displayLabel + ": " + node.degrees + "\n";
    // Add notes
    if (nodeDefs.notes.includeInGraphTooltip) titleText += nodeDefs.notes.displayLabel + ": " + node.notes + "\n";
    // Add info
    if (nodeDefs.info.includeInGraphTooltip) titleText += nodeDefs.info.displayLabel + ": " + node.info + "\n";
    // Add updated info
    if (nodeDefs.updated.includeInGraphTooltip) titleText += nodeDefs.updated.displayLabel + ": " + m_GetUpdatedDateText(node);
  } else {
    // For backwards compatability
    titleText += nodeDefs.displayLabel.label + ": " + node.label + "\n";
  }
  return titleText;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *
 * @param {*} nodeEdge
 * @returns
 */
function m_GetUpdatedDateText(nodeEdge) {
  const d = new Date(nodeEdge.meta.revision > 0 ? nodeEdge.meta.updated : nodeEdge.meta.created);
  const year = String(d.getFullYear());
  const date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + year.substr(2, 4);
  const time = d.toTimeString().substr(0, 5);
  const author = nodeEdge._nlog ? nodeEdge._nlog[nodeEdge._nlog.length - 1] : 'unknown';
  const dateTime = date + ' at ' + time + " by " + author;
  return dateTime;
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
