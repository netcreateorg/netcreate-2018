/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTER LOGIC

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import FILTER from './components/filter/FilterEnums';
const UNISYS = require("unisys/client");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// APP STATE/DATA STRUCTURES /////////////////////////////////////////////////
var D3DATA = null; // see above for description
var TEMPLATE = null; // template definition for prompts
const PROMPTS = require("system/util/prompts");
const NCLOGIC = require("./nc-logic");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DATASET = window.NC_CONFIG.dataset || "netcreate";
const TEMPLATE_URL = `templates/${DATASET}.json`;


/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTER is called by FiltersPanel when user has updated filter.
  /*/
  UDATA.HandleMessage("FILTER", function(data) {
    D3DATA = UDATA.AppState("D3DATA"); // 8/10/20 REVIEW: Is this the best way to get current data?
    m_HandleFilter(data);
  });

}); // end UNISYS_INIT


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ INIT HANDLERS
/*/

/**
 *
 * @param {Object} data {action, filter}
 *
 */
function m_HandleFilter(data) {
  console.log('HandleFilter!', data);

  if (data.action === undefined) throw "m_HandleFilter called without action";

  switch (data.action) {
    case FILTER.ACTIONS.CLEAR:
      m_ClearFilters();
      break;
    case FILTER.ACTIONS.FILTER_EDGES:
      break;
    case FILTER.ACTIONS.FILTER_NODES:
    default:
      m_FilterNodes(data.filter);
      break;
  }
  UDATA.SetAppState("D3DATA", D3DATA);
}

/**
 *
 * @param {Object} filter {id, key, operator, value}
 */
function m_FilterNodes(filter) {
  if ((filter.key === undefined) ||
    (filter.operator === undefined) ||
    (filter.value === undefined)) throw `Bad filter ${filter}`;

  const marked = { isFilteredOut: true };
  const normal = { isFilteredOut: false };

  switch (filter.operator) {
    case FILTER.STRING_OPERATORS.CONTAINS:
      m_SetMatchingNodesKey(filter.key, filter.value, marked, normal);
      break;
    default:
      throw `Unknown filter operator ${filter.operator}`;
      break;
  }

}



function m_ClearFilters() {
  const props = { isFilteredOut: false };
  NCLOGIC.SetAllObjs(D3DATA.nodes, props);
  NCLOGIC.SetAllObjs(D3DATA.edges, props);
}



/// OBJECT HELPERS ////////////////////////////////////////////////////////////


/// NODE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set nodes & EDGES that PARTIALLY match 'str' to 'yes' props.
 * All others nodes are set to 'no' props. Return matches.
 * Optionally resets all the NON matching nodes as well.
 *
 * Edges are matched if they link to the node.
 *
 * @param {String} keyToSet The template key of the node parameter we want to set,
 *                          e.g. "label"
 * @param {String} str The string to search for
 * @param {Object} yes e.g. marked = { isFilteredOut: true };
 * @param {Object} no e.g. normal = { isFilteredOut: false };
 */
const HACKMAP = {
  type: "Node_Type",
  info: "Extra Info",
  notes: "Notes"
}
function m_SetMatchingNodesKey(keyToSet, str = "", yes = {}, no = {}) {
  let returnMatches = [];
  str = NCLOGIC.EscapeRegexChars(str.trim());
  if (str === "") return undefined;
  const regex = new RegExp(/*'^'+*/ str, "i");
  // First find the nodes
  D3DATA.nodes.forEach(node => {

    let nodeField = node[keyToSet];

    // HACK
    // The old data model has secondary keys stuffed
    // into an `attributes` object.  This is a
    // holdover from the original pre-netcreate
    // data import.  If we ever change the data format
    // this HACKMAP should be removed.
    if (['type', 'info', 'notes'].includes(keyToSet)) {
      nodeField = node.attributes[HACKMAP[keyToSet]];
    }

    // Regular Test
    if (regex.test(nodeField)) {
      for (let key in yes) node[key] = yes[key];
      returnMatches.push(node);
    } else {
      for (let key in no) node[key] = no[key];
    }
  });
  // Then hide all related edges
  m_SetMatchingEdgesByNodes(returnMatches, yes, no);
  return returnMatches;
}

/**
 * Set edges that link to any node in nodes to 'yes' props.
 * All others nodes are set to 'no' props. Return matches.
 *
 * We set look for ALL nodes at once otherwise, one node can unset
 * antoher node.
 *
 * This is a specialized function because edges need to be matched
 * against both source and target.
 *
 * @param {Array} nodes Array of node objects
 * @param {Object} yes e.g. marked = { isFilteredOut: true };
 * @param {Object} no e.g. normal = { isFilteredOut: false };
 */
function m_SetMatchingEdgesByNodes(nodes, yes = {}, no = {}) {
  const nodeIDs = nodes.map(node => node.id);
  let returnMatches = [];
  D3DATA.edges.forEach(edge => {
    if ( nodeIDs.includes(edge.source.id) || nodeIDs.includes(edge.target.id) ) {
      for (let key in yes) edge[key] = yes[key];
      returnMatches.push(edge);
    } else {
      for (let key in no) edge[key] = no[key];
    }
  });
  return returnMatches;
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
