/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  EDGE MANAGER

  edge-mgr takes the incoming FILTEREDD3DATA and simplifies the
  edges, doing the following:
    1. Removes any duplicate edges between a source and target
    2. Caclulates the edge size using the edge.weight parameter
    3. Updates the VDATA app state

  When VDATA is updated, NCGraphRenderer will redraw.

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
const PR = "edge-mgr: ";

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTEREDD3DATA is updated by filter-mgr after NCDATA is changed.
  /*/
  UDATA.OnAppStateChange("FILTEREDD3DATA", data => {
    m_RenderEdges(data);
  })

}); // end UNISYS_INIT


/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * m_RenderEdges uses a Map to reduce duplicate edges into a single
 * edge, calculating edge size based on edge.weight parameter along the way.
 * @param {Object} data FILTEREDD3DATA e.g. { nodes, edges }
 * @return Updates VDATA AppState
 */
function m_RenderEdges(data) {
  const DEFAULT_SIZE = 1;
  const VDATA = data;

  const TEMPLATE = UDATA.AppState("TEMPLATE");
  const edgeSizeMax = TEMPLATE.edgeSizeMax;

  /*/ ISSUES
      * How do we handle direction?
        => Can be handled with a single edge, we just need to determin directionlaity
      * How do we handle bidrectionality?  Is it a single edge?
        => Yes.  Just with two arrowheads.
  /*/

  // Prepare to check for color
  const colorsAreDefined = TEMPLATE.edgeDefs.type && TEMPLATE.edgeDefs.type.options && Array.isArray(TEMPLATE.edgeDefs.type.options) && TEMPLATE.edgeDefs.type.options.length > 0;

  // Synthesize duplicate edges into a single edge.
  const edgeMap = new Map(); // key = {source}{target}
  const edgeColorWeightMap = new Map(); // key = {source}{target}, value = colorMap[[color, weightTotal]]
  VDATA.edges.forEach(e => {
    const edgeKey = m_GetEdgeKey(e); // single key for both directions
    const currEdge = edgeMap.get(edgeKey);
    const eWeight = (Number(e.weight) || DEFAULT_SIZE); // weight defaults to 1, force Number

    // 1. Set Size
    e.size = eWeight + (currEdge ? currEdge.size : 0); // cumulative size

    // 2. Update Color Weight Map
    if (colorsAreDefined) {
      const colorWeightMap = edgeColorWeightMap.get(edgeKey) || new Map(); // key = color, value = weight
      const color = m_LookupEdgeColor(e, TEMPLATE);
      const colorWeight = colorWeightMap.get(color) || 0; // default to weight 0 if color was not previously defined
      colorWeightMap.set(color, colorWeight + eWeight);
      edgeColorWeightMap.set(edgeKey, colorWeightMap);
    }

    // 3. Limit to Max Edge Size
    if (edgeSizeMax > 0) e.size = Math.min(edgeSizeMax, e.size);

    // 4. Save value
    edgeMap.set(edgeKey, e);
  });

  // 5. Set Color
  VDATA.edges.forEach(e => {
    e.color = m_GetWeightiestColor(e, edgeColorWeightMap);
  });

  VDATA.edges = [...edgeMap.values()];
  UDATA.SetAppState('VDATA', VDATA);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a unique key in the form "<lowestID>,<highestID>"
 * Used to generate a key for all edges that share the same source and target
 * regardless of direction
 * @param {Object} edge
 * @returns {string}
 */
function m_GetEdgeKey(edge) {
  let skey = edge.source;
  let tkey = edge.target;
  return [skey, tkey].sort().toString();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Finds the color with the most weight for each edge in edgeColorWeightMap
 * @param {Object} edge
 * @param {Map} edgeColorWeightMap
 * @returns
 */
function m_GetWeightiestColor(edge, edgeColorWeightMap) {
  const edgeKey = m_GetEdgeKey(edge);
  const colorWeightMap = edgeColorWeightMap.get(edgeKey); // Map[[ color, weight ]]
  const colors = [...colorWeightMap.keys()];
  colors.sort((a, b) => colorWeightMap.get(b) - colorWeightMap.get(a)); // descending
  return colors[0];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Looks up the edge color defined in the passed TEMPLATE
 * Fall back to default if type is not defined
 * @param {Object} edge
 * @param {Object} TEMPLATE
 * @returns {string} e.g. '#FF00FF' as defined by TEMPLATE type.option
 *                   or `undefined` if no color type is defined
 */
function m_LookupEdgeColor(edge, TEMPLATE) {
  const type = edge.type;
  const typeOption = TEMPLATE.edgeDefs.type.options.find(o => o.label === type);
  return typeOption ? typeOption.color : TEMPLATE.edgeDefs.type.options[0].color;
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
