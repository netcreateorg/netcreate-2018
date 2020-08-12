/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTER LOGIC


  FILTERDEFS = {
    nodes: { ...filters },
    edges: { ...filters }
  }

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
  /*/ FILTER_SET is called by StringFilter when user has updated filter.
  /*/
  UDATA.HandleMessage("FILTER_SET", data => {
    m_HandleFilterSet(data);
  })

  // is this the right listner?
  UDATA.OnAppStateChange("FILTERDEFS", data => {
    console.error('OnAppStateChange: FILTER', data);
    m_HandleFilterDefsUpdate(data);
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTER is called by FiltersPanel when user has updated filter.
      This triggers the actual filtering.
  /*/
  UDATA.HandleMessage("FILTER", data => {
    m_HandleFilter(data);
  });

}); // end UNISYS_INIT


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ INIT HANDLERS
/*/

/**
 *
 * @param {Object} data {defs}
 */
function m_HandleFilterDefsUpdate(data) {
  m_ApplyFilters(data);
}

/**
 * Define an individual filter
 * @param {Object} data {group, filter}
 */
function m_HandleFilterSet(data) {
  console.error('received', data);

  const FILTERDEFS = UDATA.AppState("FILTERDEFS").defs; // already an object
  console.error('FILTERDEFS is', FILTERDEFS);

  // assume node for now
  // should be checking data.group to determine which set to use
  let nodeFilters = FILTERDEFS[0].filters;

  // set it
  const index = nodeFilters.findIndex(f => f.id === data.filter.id);
  nodeFilters.splice(index, 1, data.filter);
  FILTERDEFS[0].filters = nodeFilters;

  console.log('FILTERDEFS spliced is now', FILTERDEFS); // already an object
  UDATA.SetAppState("FILTERDEFS", { defs: FILTERDEFS });
  // UDATA.LocalCall('FILTERDEFS_UPDATED', FILTERDEFS);
}

/**
 * Walk down the list of filters and apply them all
 */
function m_ApplyFilters(data) {
  // HACK
  // just grab the first filter for now while we figure
  // out how to handle the whole round trip
  // eventually need to apply ALL filters
  // data.defs[0] = nodes
  // data.defs[0][0] = first filter
  // const filter = data.defs[0].filters[0];
  // m_HandleFilter({
  //   action: FILTER.ACTIONS.FILTER_NODES,
  //   filter
  // });

  // hack in selection for now
  const nodeFilters = data.defs[0].filters;
  const edgeFilters = data.defs[1].filters;

  nodeFilters.forEach(filter => {
    m_HandleFilter({ action: FILTER.ACTIONS.FILTER_NODES, filter})
  })
  edgeFilters.forEach(filter => {
    m_HandleFilter({ action: FILTER.ACTIONS.FILTER_EDGES, filter})
  })
}

/**
 *
 * @param {Object} data {action, filter}
 *
 */
function m_HandleFilter(data) {
  console.log('m_HandleFilter!', data);
  const D3DATA = UDATA.AppState("D3DATA");
  if (data.action === undefined) throw "m_HandleFilter called without action";

  switch (data.action) {
    case FILTER.ACTIONS.CLEAR:
      m_ClearFilters(D3DATA.nodes);
      m_ClearFilters(D3DATA.edges);
      break;
    case FILTER.ACTIONS.FILTER_NODES:
      m_FilterNodes(data.filter);
      break;
    case FILTER.ACTIONS.FILTER_EDGES:
      m_FilterEdges(data.filter);
      break;
    default:
      throw `Unknown filter action ${data.action}`;
      break;
  }
  UDATA.SetAppState("D3DATA", D3DATA);
}

/**
 *
 * @param {Object} filter {id, key, operator, value}
 */
function m_FilterNodes(filter) {
  console.log('...m_FilterNodes', filter);
  if ((filter.key === undefined) ||
    (filter.operator === undefined) ||
    (filter.value === undefined)) return; // nothing to filter

  const marked = { isFilteredOut: true };
  const normal = { isFilteredOut: false };

  // FIXME
  // If value is cleared, how do we clear the search?

  switch (filter.operator) {
    case FILTER.STRING_OPERATORS.CONTAINS:
      m_SetMatchingNodesKey(filter.key, filter.value, marked, normal);
      break;
    case FILTER.STRING_OPERATORS.NOT_CONTAINS:
      m_SetMatchingNodesKey(filter.key, filter.value, marked, normal, false);
      break;
    case FILTER.STRING_OPERATORS.NO_OP:
      // ignore
      break;
    default:
      throw `Unknown filter operator ${filter.operator}`;
      break;
  }

}

/**
 *
 * @param {Object} filter {id, key, operator, value}
 */
function m_FilterEdges(filter) {
  console.log('m_FilterEdges', filter);
  if ((filter.key === undefined) ||
    (filter.operator === undefined) ||
    (filter.value === undefined)) return; // nothing to filter

  const marked = { isFilteredOut: true };
  const normal = { isFilteredOut: false };

  switch (filter.operator) {
    case FILTER.STRING_OPERATORS.CONTAINS:
      // m_SetMatchingNodesKey(filter.key, filter.value, marked, normal);
      break;
    case FILTER.STRING_OPERATORS.NOT_CONTAINS:
      // m_SetMatchingNodesKey(filter.key, filter.value, marked, normal, false);
      break;
    case FILTER.STRING_OPERATORS.NO_OP:
      // ignore
      break;
    default:
      throw `Unknown filter operator ${filter.operator}`;
      break;
  }

}


function m_ClearFilters(arr) {
  console.log('Clearing Filters!!!!')
  const props = { isFilteredOut: false };
  NCLOGIC.SetAllObjs(arr, props);
}



/// OBJECT HELPERS ////////////////////////////////////////////////////////////


/// NODE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set nodes & EDGES that PARTIALLY match 'str' to 'yes' props.
 * All others nodes are set to 'no' props. Return matches.
 * Optionally resets all the NON matching nodes as well.
 *
 * If matched, we set `isFiltered` flag to true.
 *
 * Edges are matched if they link to the node.
 *
 * @param {String} keyToSet The template key of the node parameter we want to set,
 *                          e.g. "label"
 * @param {String} str The string to search for
 * @param {Object} yes e.g. marked = { isFilteredOut: true };
 * @param {Object} no e.g. normal = { isFilteredOut: false };
 * @param {Bool} contains regex text contains or not contains
 */
const HACKMAP = {
  type: "Node_Type",
  info: "Extra Info",
  notes: "Notes"
}
function m_SetMatchingNodesKey(keyToSet, str = "", yes = {}, no = {}, contains = true) {
  const D3DATA = UDATA.AppState("D3DATA"); // 8/10/20 REVIEW: Is this the best way to get current data?
  let returnMatches = [];
  str = NCLOGIC.EscapeRegexChars(str.trim());

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

    let matches;
    if (str === "") {
      // empty string doesn't match anything
      matches = false;
    } else if (contains) {
      matches = !regex.test(nodeField);
    } else {
      matches = regex.test(nodeField);
    }

    if (matches) {
      console.log('......filtering out', node.label);
      for (let key in yes) node[key] = yes[key];
      returnMatches.push(node);
    } else {
      console.log('......unfiltering', node.label);
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
  const D3DATA = UDATA.AppState("D3DATA");
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
