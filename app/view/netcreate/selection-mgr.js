/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SELECTION MANAGER

  selection-mgr handles UI selection events like:
  * mouse over graph node
  * Others TBD as selection is rewritten.

  SELECTION data is
    { nodes: [], edges: [], selectedSecondary: undefined };

  In general
  * `nodes[0]` will be the selected graph node (using the animated 3 arrow
                        cursor) with an open Node editor
  * `edges[]` are the edges linked to `nodes[0]`
  * `selectedSecondary` is the node id of the source or target node
                        that are highlighted in the graph (using the
                        animated single arrow cursor)

  As of 2023-07 this is a WIP.  There are remnants of v1.x SELECTION management
  in nc-logic.  A lot of the more complex logic has been cleaned up and
  deprecated:
    * AutoComplete
    * NodeSelector
    * EdgeEditor
    * d3-simplenetgraph

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'selection-mgr: ';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SELECTION_MODE = {
  NORMAL: 'normal', // graph is selectable
  EDGE_EDIT: 'edge_edit', // edge is being edited
  // NODE_EDIT is not necessary b/c the transparent screen prevents clicks
  SOURCETARGET: 'sourcetarget' // waiting for a source or target
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_SelectionMode = SELECTION_MODE.NORMAL; // default

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** lifecycle INITIALIZE handler
 */
MOD.Hook('INITIALIZE', () => {
  UDATA.HandleMessage('SELECTMGR_SET_MODE', m_SetMode);
  UDATA.HandleMessage('D3_SELECT_NODE', m_D3SelectNode);
  UDATA.HandleMessage('SELECTMGR_SELECT_SECONDARY', m_SelectSecondary);
  UDATA.HandleMessage('SELECTMGR_DESELECT_SECONDARY', m_DeselectSecondary);
  // NODETABLE_SELECT_NODE
  // AUTOSUGGEST_SELECT_NODE?
}); // end UNISYS_INIT

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Set Selection Mode via SELECTMGR_SET_MODE
 *  @param {Object} data
 *  @param {Object} data.mode NORMAL || EDGE_EDIT || SOURCETARGET
 */
function m_SetMode(data) {
  let newmode = SELECTION_MODE.NORMAL; // default
  if (Object.values(SELECTION_MODE).includes(data.mode)) newmode = data.mode;
  m_SelectionMode = newmode;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** User clicked on d3 graph node
 *  --  Normal mode, clicking on a node selects it
 *  --  SourceTarget mode is for selecting a source or target node while editing an edge
 *  @param {Object} data
 *  @param {array:string} data.nodeLabels
 *  @param {array:number} data.nodeIDs
 */
function m_D3SelectNode(data) {
  const node = m_GetNode(data);
  if (m_SelectionMode === SELECTION_MODE.NORMAL) {
    m_SendSelectionUpdate(node);
  } else if (m_SelectionMode === SELECTION_MODE.EDGE_EDIT) {
    // ignore selection during EDGE_EDIT if SOURCE/TARGET has not been selected yet
    if (DBG)
      console.log(PR, 'm_D3SelectNode: ignoring selection during edge edit mode');
  } else if (m_SelectionMode === SELECTION_MODE.SOURCETARGET) {
    m_SendSourceTargetSelectionUpdate(node);
  } else {
    throw `Unknown SELECTION Mode ${m_SelectionMode}`;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Get the node that was passed via the search string
 *  either nodeIDs or nodeLabels
 *  @param {Object} searchdata
 *  @param {array} searchdata.nodeLabels strings
 *  @param {array} searchdata.nodeIDs numbers
 *  @returns {Object} single node
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Broadcast SELECTION and HILITE updates for selecting a single node
 *  @param {Object} node
 */
function m_SendSelectionUpdate(node) {
  const NCDATA = UDATA.AppState('NCDATA');
  let newSelection, newHilite;
  if (node === undefined) {
    // Node not found, clear selection state
    newSelection = { nodes: [], edges: [], selectedSecondary: undefined };
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
    newSelection = { nodes: [node], edges, selectedSecondary: undefined };
    newHilite = { autosuggestHiliteNodeId: undefined };
  }
  // Broadcast selection/hilite updates
  UDATA.SetAppState('SELECTION', newSelection);
  UDATA.SetAppState('HILITE', newHilite);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Broadcast SELECT_SOURCETARGET updates for selecting a source or target
 *  @param {Object} node
 */
function m_SendSourceTargetSelectionUpdate(node) {
  if (node === undefined) return; // skip update
  UDATA.LocalCall('SELECT_SOURCETARGET', { node });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** During Edge editing, show animated cursor after user selects a source
 *  or target node.  (For secondary selections)
 *  Broadcast SELECTMGR_SELECT_SECONDARY updates for selecting a source or target
 *  @param {Object} data
 *  @param {Object} data.node
 */
function m_SelectSecondary(data) {
  const SELECTION = UDATA.AppState('SELECTION');
  SELECTION.selectedSecondary = data.node.id;
  UDATA.SetAppState('SELECTION', SELECTION);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Deselect the secondary selection
 *  During Edge editing, after the user has selected the source or target
 *  node, we turn off the secondary select (so the single blue rotating arrow
 *  is cleared from the graph)
 */
function m_DeselectSecondary() {
  // Broadcast secondary deselection -- remove animated arrow
  const SELECTION = UDATA.AppState('SELECTION');
  SELECTION.selectedSecondary = undefined;
  UDATA.SetAppState('SELECTION', SELECTION);
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
