/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SELECTION MANAGER

  selection-mgr handles UI selection events like:
  * mouse over graph node
  * Others TBD as selection is rewritten.

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
const PR = "selection-mgr: ";

const SELECTION_MODE = {
  NORMAL: 'normal', // graph is selectable
  EDGE_EDIT: 'edge_edit', // edge is being edited
  // NODE_EDIT is not necessary b/c the transparent screen prevents clicks
  SOURCETARGET: 'sourcetarget' // waiting for a source or target
}

/// PRIVATE VARS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_SelectionMode = SELECTION_MODE.NORMAL; // default

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  UDATA.HandleMessage('SELECTMGR_SET_MODE', m_SetMode);
  UDATA.HandleMessage('D3_SELECT_NODE', m_D3SelectNode);
  // NODETABLE_SELECT_NODE
  // AUTOSUGGEST_SELECT_NODE?
}); // end UNISYS_INIT


/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///

/**
 * Set Selection Mode via SELECTMGR_SET_MODE
 * @param {Object} data
 * @param {Object} data.mode NORMAL || EDGE_EDIT || SOURCETARGET
 */
function m_SetMode(data) {
  let newmode = SELECTION_MODE.NORMAL; // default
  if (Object.values(SELECTION_MODE).includes(data.mode)) newmode = data.mode;
  m_SelectionMode = newmode;
}

/**
 * User clicked on d3 graph node
 * --  Normal mode, clicking on a node selects it
 * --  SourceTarget mode is for selecting a source or target node while editing an edge
 * @param {Object} data
 * @param {array:string} data.nodeLabels
 * @param {array:number} data.nodeIDs
 */
function m_D3SelectNode(data) {
  const node = m_GetNode(data);
  if (m_SelectionMode === SELECTION_MODE.NORMAL) {
    m_SendSelectionUpdate(node);
  } else if (m_SelectionMode === SELECTION_MODE.EDGE_EDIT) {
    // ignore selection during EDGE_EDIT if SOURCE/TARGET has not been selected yet
    if (DBG) console.log(PR, 'm_D3SelectNode: ignoring selection during edge edit mode')
  } else if (m_SelectionMode === SELECTION_MODE.SOURCETARGET) {
    m_SendSourceTargetSelectionUpdate(node);
  } else {
    throw `Unknown SELECTION Mode ${m_SelectionMode}`
  }
}

/**
 * Get the node that was passed via the search string
 * either nodeIDs or nodeLabels
 * @param {Object} searchdata
 * @param {array} searchdata.nodeLabels strings
 * @param {array} searchdata.nodeIDs numbers
 * @returns {Object} single node
 */
function m_GetNode(searchdata) {
  const NCDATA = UDATA.AppState('NCDATA');
  const { nodeLabels = [], nodeIDs = [] } = searchdata;
  const nodeLabel = nodeLabels[0];
  const nodeId = nodeIDs[0];
  let node;
  if (nodeId) {
    node = NCDATA.nodes.find(n => n.id === nodeId);
  } else if (nodeLabel) {
    node = NCDATA.nodes.find(n => n.label === nodeLabel);
  } else {
    // No node selected, so deselect
  }
  return node;
}

/**
 * Broadcast SELECTION and HILITE updates for selecting a single node
 * @param {*} node
 */
function m_SendSelectionUpdate(node) {
  const NCDATA = UDATA.AppState('NCDATA');
  let newSelection, newHilite;
  if (node === undefined) {
    // Node not found, clear selection state
    newSelection = { nodes: [], edges: [] };
    newHilite = { autosuggestHiliteNodeId: undefined };
  } else {
    // Load existing node and edges
    const nid = node.id;
    let edges = [];
    if (NCDATA.edges)
      edges = edges.concat(
        NCDATA.edges.filter(edge => edge.source === nid || edge.target === nid)
      );
    // create select state object
    newSelection = { nodes: [node], edges };
    newHilite = { autosuggestHiliteNodeId: undefined };
  }
  // Broadcast selection/hilite updates
  UDATA.SetAppState('SELECTION', newSelection);
  UDATA.SetAppState('HILITE', newHilite);
}

/**
 * Broadcast SELECT_SOURCETARGET updates for selecting a source or target
 * @param {*} node
 */
function m_SendSourceTargetSelectionUpdate(node) {
  if (node === undefined) return; // skip update
  UDATA.LocalCall('SELECT_SOURCETARGET', { node });
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
