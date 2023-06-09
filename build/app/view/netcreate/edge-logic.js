/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EDGE LOGIC

  edge-logic handles

  edge-logic takes the incoming FILTEREDD3DATA and simplifies the
  edges, doing the following:
    1. Removes any duplicate edges between a source and target
    2. Caclulates the edge size using the edge.weigth parameter
    3. Updates the SYNTHESIZEDD3DATA app state

  When SYNTHESIZEDD3DATA is updated, d3-simplenetgraph will redraw.

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
const PR = "edge-logic: ";

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTEREDD3DATA is updated by filter-logic after NCDATA is changed.
  /*/
  UDATA.OnAppStateChange("FILTEREDD3DATA", data => {
    m_SynthesizeEdges(data);
  })

}); // end UNISYS_INIT


/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * m_SynthesizeEdges uses a Map to reduce duplicate edges into a simple
 * array, calculating edge size based on edge.weight parameter along the way.
 * @param {object} data FILTEREDD3DATA e.g. { nodes, edges }
 */
function m_SynthesizeEdges(data) {
  const DEFAULT_SIZE = 1;
  const SYNTHESIZEDD3DATA = data;

  const TEMPLATE = UDATA.AppState("TEMPLATE");
  const edgeSizeMax = TEMPLATE.edgeSizeMax;

  /*/ ISSUES
      * How do we handle direction?
        => Can be handled with a single edge, we just need to determin directionlaity
      * How do we handle bidrectionality?  Is it a single edge?
        => Yes.  Just with two arrowheads.
  /*/

  // Synthesize duplicate edges into a single edge.
  const edgeMap = new Map(); // key = {source}{target}
  SYNTHESIZEDD3DATA.edges.forEach(e => {
    let skey = e.source;
    let tkey = e.target;
    if (e.target < e.source) { // the smaller key is always first
      skey = e.target;
      tkey = e.source;
    }
    const edgeKey = `${skey},${tkey}`;
    if (edgeMap.has(edgeKey)) {
      const currEdge = edgeMap.get(edgeKey);
      const currSize = currEdge.size;
      e.size = currSize + (e.weight || DEFAULT_SIZE); // weight defaults to 1
    } else {
      e.size = e.weight || DEFAULT_SIZE; // weight defaults to 1
    }
    // set max
    if (edgeSizeMax > 0) e.size = Math.min(edgeSizeMax, e.size);
    edgeMap.set(edgeKey, e);
  });
  SYNTHESIZEDD3DATA.edges = [...edgeMap.values()];
  UDATA.SetAppState('SYNTHESIZEDD3DATA', SYNTHESIZEDD3DATA);
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
