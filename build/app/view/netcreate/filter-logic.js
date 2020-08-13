/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTER LOGIC


  Filter Definitions

  The initial filter definitions are loaded from the current database template.

  FDATA = {
    nodes: { ...filters },
    edges: { ...filters }
  }

  Filters can be stacked.
  * You can define two "Label" filters, for example.
    The only reason you can't do it right now is because the filter template
    is reading directly from the _default.template file.  You can easily
    insert another filter into the mix.



// Playing with alternative representation:
// PROS
// * More concise
// CONS
// * Restricts ability to create two filters on the same key
const FILTERDEF = {
  nodes: {
    label: "Nodes",
    filters: {
      label: {
        keylabel: 'Label',
        operator: 'contains',
        value: 'tacitus'
      },
      type: {
        keylabel: 'Type',
        operator: 'not-contains',
        value: 'person'
      },
      notes: {
        keylabel: 'Significance',
        operator: 'contains',
        value: 'xxx'
      }
    }
  },
  edges: {
    label: "Edges",
    filters: {}
  }
}




// eventually generate this from template?
let filterDefs = [
  {
    group: "node",
    label: "Nodes -- Show me all nodes where...",
    filters: [
      {
        id: '1',
        key: 'label',
        keylabel: 'Label',
        operator: 'no-op',
        value: ''
      },
      {
        id: '4',
        key: 'label',
        keylabel: 'Label',
        operator: 'no-op',
        value: ''
      },
      {
        id: '2',
        key: 'type',
        keylabel: 'Type',
        operator: 'no-op',
        value: ''
      },
      {
        id: '3',
        key: 'notes',
        keylabel: 'Significance',
        operator: 'no-op',
        value: ''
      }
    ]
  },
  {
    group: "edge",
    label: "Edges",
    filters: [
      {
        id: '5',
        key: 'source',
        keylabel: 'Source',
        operator: 'no-op',
        value: ''
      },
      {
        id: '6',
        key: 'type',
        keylabel: 'Type',
        operator: 'no-op',
        value: ''
      },
      {
        id: '7',
        key: 'target',
        keylabel: 'Target',
        operator: 'no-op',
        value: ''
      }
    ]
  }
];



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

// Map to convert old 'attributes' data formats. Used in m_IsNodeMatchedByFilter
const HACKMAP = {
  type: "Node_Type",
  info: "Extra Info",
  notes: "Notes"
}

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  console.error('filter-logic INITIALIZE');

  UDATA.OnAppStateChange("TEMPLATE", data => {
    m_ImportFilters();
  });

  UDATA.OnAppStateChange("FDATA", data => {
    console.error('OnAppStateChange: FILTER', data);
    // The filter defs have been updated, so apply the filters.
    m_FiltersApply();
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTER_DEFINE is called by StringFilter when user has updated filter.
  /*/
  UDATA.HandleMessage("FILTER_DEFINE", data => {
    m_FilterDefine(data);
  })

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTER_CLEAR is called by FiltersPanel when user clicks "Clear Filters" button
  /*/
  UDATA.HandleMessage("FILTER_CLEAR", () => {
    m_ClearFilters();
  });

}); // end UNISYS_INIT


/// IMPORT FILTER DEFINITIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Loads filters from template file
 */
function m_ImportFilters() {
  TEMPLATE = UDATA.AppState("TEMPLATE");

  let nodePrompts = TEMPLATE.nodePrompts;
  let edgePrompts = TEMPLATE.edgePrompts;

  let fdata = {
    nodes: {
      group: "nodes", // this needs to be passed to StringFilter
      label: "Node Filters",
      filters: m_ImportPrompts(nodePrompts)
    },
    edges: {
      group: "edges", // this needs to be passed to StringFilter
      label: "Edge Filters",
      filters: m_ImportPrompts(edgePrompts)
    }
  };

  UDATA.SetAppState("FDATA", fdata);
}

function m_ImportPrompts(prompts) {
  let filters = [];
  let counter = 0;
  for (const [key, prompt] of Object.entries(prompts)) {
    let operator;
    switch (prompt.type) {
      case FILTER.TYPES.STRING:
        operator = FILTER.STRING_OPERATORS.NO_OP; // default to no_op
        break;
      case FILTER.TYPES.NUMBER:
        console.error('skipping NUMBER for now');
        // operator = FILTER.NUMBER_OPERATORS.GT; // skip for now
        break;
      case FILTER.TYPES.SELECT:
        console.error('skipping SELECT for now');
        break;
      case FILTER.TYPES.NODE:
        operator = FILTER.STRING_OPERATORS.NO_OP; // default to no_op
        break;
      case FILTER.TYPES.HIDDEN:
        break;
      default:
        // edge template item "edgeIsLockedMessage" will trigger this message
        console.warn(`Unknown node prompt type ${prompt.type} for ${prompt}`);
        break;
    }
    if (operator === undefined) continue; // don't add filter if operator is hidden
    let filter = {
      id: counter++,
      key: key,
      type: prompt.type,
      keylabel: prompt.label,
      operator: operator,
      value: ''
    };
    filters.push(filter);
  }
  return filters;
}

/// UDATA HANDLERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/**
 * Define an individual filter
 * @param {Object} data {group, filter}
 */
function m_FilterDefine(data) {
  console.error('FILTER_DEFINE received', data);

  const FDATA = UDATA.AppState("FDATA");
  console.error('FDATA is', FDATA);

  if (data.group === "nodes") {
    let nodeFilters = FDATA.nodes.filters;
    const index = nodeFilters.findIndex(f => f.id === data.filter.id);
    nodeFilters.splice(index, 1, data.filter);
    FDATA.nodes.filters = nodeFilters;
  } else if (data.group === "edges") {
    let edgeFilters = FDATA.edges.filters;
    const index = edgeFilters.findIndex(f => f.id === data.filter.id);
    edgeFilters.splice(index, 1, data.filter);
    FDATA.edges.filters = edgeFilters;
  } else {
    throw `FILTER_DEFINE called with unknown group: ${data.group}`;
  }

  console.log('FDATA spliced is now', FDATA); // already an object
  UDATA.SetAppState("FDATA", FDATA);
}

/**
 * Walk down the list of filters and apply them all
 * @param {Object} data A UDATA pkt {defs}
 */
function m_FiltersApply() {
  const FDATA = UDATA.AppState("FDATA");

  console.error('@@@@@ m_FiltersApply', FDATA);

  // hack in selection for now
  // we should update the data.defs to use objects
  // rather than an array?
  const nodeFilters = FDATA.nodes.filters;
  const edgeFilters = FDATA.edges.filters;

  m_FiltersApplyToNodes(nodeFilters);
  m_FiltersApplyToEdges(edgeFilters);
}

function m_ClearFilters() {
  const props = { isFilteredOut: false };
  const FDATA = UDATA.AppState("FDATA");
  NCLOGIC.SetAllObjs(FDATA.nodes.filters, props); // clear nodes
  NCLOGIC.SetAllObjs(FDATA.edges.filters, props); // clear props
  m_FiltersApply();
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ NODE FILTERS
/*/

/**
 * Side effect:
 *   D3DATA.nodes are updated with `isFilteredOut` flags.
 *
 * @param {Array} filters
 */
function m_FiltersApplyToNodes(filters) {
  const D3DATA = UDATA.AppState("D3DATA");
  D3DATA.nodes.forEach(node => {
    m_FiltersApplyToNode(node, filters);
  });
  UDATA.SetAppState("D3DATA", D3DATA);
}

function m_FiltersApplyToNode(node, filters) {
  let all_no_op = true;
  let matched = true;
  // implicit AND.  ALL filters must return true.
  filters.forEach(filter => {
    if (filter.operator === FILTER.STRING_OPERATORS.NO_OP) return; // skip no_op
    all_no_op = false;
    if (!m_IsNodeMatchedByFilter(node, filter)) {
      matched = false;
    }
  });
  if (all_no_op) {
    // no filters defined, undo isFilteredOut
    node.isFilteredOut = false;
  } else {
    // node is filtered out if it fails any filter tests
    node.isFilteredOut = !matched;
  }
}

function m_IsNodeMatchedByFilter(node, filter) {
  if ((filter.key === undefined) ||
    (filter.operator === undefined) ||
    (filter.value === undefined)) {
    return false; // nothing to filter
  }

  let nodeStr;
  // HACK
  // The old data model has secondary keys stuffed
  // into an `attributes` object.  This is a
  // holdover from the original pre-netcreate
  // data import.  If we ever change the data format
  // this HACKMAP should be removed.
  if (['type', 'info', 'notes'].includes(filter.key)) {
    nodeStr = node.attributes[HACKMAP[filter.key]];
  } else {
    nodeStr = node[filter.key];
  }
  switch (filter.operator) {
    case FILTER.STRING_OPERATORS.CONTAINS:
      return m_MatchString(filter.value, nodeStr, true);
      break;
    case FILTER.STRING_OPERATORS.NOT_CONTAINS:
      return m_MatchString(filter.value, nodeStr, false);
      break;
    default:
      throw `Unknown filter operator ${filter.operator}`;
      break;
  }
}

function m_MatchString(pin, haystack, contains = true) {
  pin = NCLOGIC.EscapeRegexChars(pin.trim());
  const regex = new RegExp(/*'^'+*/ pin, "i");
  let matches;
  if (pin === "") {
    // empty string matches everything
    matches = true;
  } else if (contains) {
    matches = regex.test(haystack);
  } else {
    matches = !regex.test(haystack);
  }
  return matches;
}




/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EDGE FILTERS
/*/

function m_FiltersApplyToEdges(filters) {
  const D3DATA = UDATA.AppState("D3DATA");
  D3DATA.edges.forEach(edge => {
    m_FiltersApplyToEdge(edge, filters);
  });
  UDATA.SetAppState("D3DATA", D3DATA);
}

function m_FiltersApplyToEdge(edge, filters) {
  // regardless of filter definition,
  // always hide edge if it's attached to a filtered node
  if (edge.source.isFilteredOut || edge.target.isFilteredOut) {
    edge.isFilteredOut = true;  // no filters, revert
    return;
  }

  let all_no_op = true;
  let matched = true;
  // implicit AND.  ALL filters must return true.
  filters.forEach(filter => {
    if (filter.operator === FILTER.STRING_OPERATORS.NO_OP) return; // skip no_op
    all_no_op = false;
    if (!m_IsEdgeMatchedByFilter(edge, filter)) {
      matched = false;
    }
  });
  if (all_no_op) {
    // no filters defined, undo isFilteredOut
    edge.isFilteredOut = false;
  } else {
    // edge is filtered out if it fails ANY filter tests
    edge.isFilteredOut = !matched;
  }
}

function m_IsEdgeMatchedByFilter(edge, filter) {
  if ((filter.key === undefined) ||
    (filter.operator === undefined) ||
    (filter.value === undefined)) {
    return false; // nothing to filter
  }

  // edges require special handling because `source` and `target`
  // point to node data, not simple strings.
  let edgeStr;
  if (filter.type === FILTER.TYPES.NODE) {
    edgeStr = edge[filter.key].label; // search on the source/target node label
  } else {
    edgeStr = edge[filter.key];
  }

  switch (filter.operator) {
    case FILTER.STRING_OPERATORS.CONTAINS:
      return m_MatchString(filter.value, edgeStr, true);
      break;
    case FILTER.STRING_OPERATORS.NOT_CONTAINS:
      return m_MatchString(filter.value, edgeStr, false);
      break;
    default:
      throw `Unknown filter operator ${filter.operator}`;
      break;
  }
}

  // if any attached node is filtered, then don't show self.


// Handle Clear request: FILTERS_CLEAR?





















/// FIRST PASS FILTERING //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
///
///  DEPRECATED!!!!
///
///  This approach applied filtering filter by filter.
///  Instead we need to apply all filters at once?

// /**
//  * Walk down the list of filters and apply them all
//  * @param {Object} data A UDATA pkt {defs}
//  */
// function xm_FiltersApply(data) {
//   // HACK
//   // just grab the first filter for now while we figure
//   // out how to handle the whole round trip
//   // eventually need to apply ALL filters
//   // data.defs[0] = nodes
//   // data.defs[0][0] = first filter
//   // const filter = data.defs[0].filters[0];
//   // m_HandleFilter({
//   //   action: FILTER.ACTIONS.FILTER_NODES,
//   //   filter
//   // });

//   // hack in selection for now
//   // we should update the data.defs to use objects
//   // rather than an array?
//   const nodeFilters = data.defs[0].filters;
//   const edgeFilters = data.defs[1].filters;

//   nodeFilters.forEach(filter => {
//     m_FilterApply({ action: FILTER.ACTIONS.FILTER_NODES, filter})
//   })
//   edgeFilters.forEach(filter => {
//     m_FilterApply({ action: FILTER.ACTIONS.FILTER_EDGES, filter})
//   })
// }

// /**
//  * Apply a specific group of filters
//  * This is triggered by:
//  * 1. AppState "FILTER" request, or
//  * 2. AppState "FILTERDEFS" update
//  * @param {Object} data {action, filter}
//  *
//  */
// function m_FilterApply(data) {
//   console.log('m_HandleFilter!', data);
//   const D3DATA = UDATA.AppState("D3DATA");
//   if (data.action === undefined) throw "m_HandleFilter called without action";

//   switch (data.action) {
//     case FILTER.ACTIONS.CLEAR:
//       m_ClearFilters(D3DATA.nodes);
//       m_ClearFilters(D3DATA.edges);
//       break;
//     case FILTER.ACTIONS.FILTER_NODES:
//       m_FilterNodes(data.filter);
//       break;
//     case FILTER.ACTIONS.FILTER_EDGES:
//       m_FilterEdges(data.filter);
//       break;
//     default:
//       throw `Unknown filter action ${data.action}`;
//       break;
//   }
//   UDATA.SetAppState("D3DATA", D3DATA);
// }

// /**
//  *
//  * @param {Object} filter {id, key, operator, value}
//  */
// function m_FilterNodes(filter) {
//   console.log('...m_FilterNodes', filter);
//   if ((filter.key === undefined) ||
//     (filter.operator === undefined) ||
//     (filter.value === undefined)) return; // nothing to filter

//   const marked = { isFilteredOut: true };
//   const normal = { isFilteredOut: false };

//   // FIXME
//   // If value is cleared, how do we clear the search?

//   switch (filter.operator) {
//     case FILTER.STRING_OPERATORS.CONTAINS:
//       m_SetMatchingNodesKey(filter.key, filter.value, marked, normal);
//       break;
//     case FILTER.STRING_OPERATORS.NOT_CONTAINS:
//       m_SetMatchingNodesKey(filter.key, filter.value, marked, normal, false);
//       break;
//     case FILTER.STRING_OPERATORS.NO_OP:
//       // ignore
//       break;
//     default:
//       throw `Unknown filter operator ${filter.operator}`;
//       break;
//   }

// }

// /**
//  *
//  * @param {Object} filter {id, key, operator, value}
//  */
// function m_FilterEdges(filter) {
//   console.log('m_FilterEdges', filter);
//   if ((filter.key === undefined) ||
//     (filter.operator === undefined) ||
//     (filter.value === undefined)) return; // nothing to filter

//   const marked = { isFilteredOut: true };
//   const normal = { isFilteredOut: false };

//   switch (filter.operator) {
//     case FILTER.STRING_OPERATORS.CONTAINS:
//       // m_SetMatchingNodesKey(filter.key, filter.value, marked, normal);
//       break;
//     case FILTER.STRING_OPERATORS.NOT_CONTAINS:
//       // m_SetMatchingNodesKey(filter.key, filter.value, marked, normal, false);
//       break;
//     case FILTER.STRING_OPERATORS.NO_OP:
//       // ignore
//       break;
//     default:
//       throw `Unknown filter operator ${filter.operator}`;
//       break;
//   }

// }





// /// OBJECT HELPERS ////////////////////////////////////////////////////////////


// /// NODE HELPERS //////////////////////////////////////////////////////////////
// /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// /**
//  * Set nodes & EDGES that PARTIALLY match 'str' to 'yes' props.
//  * All others nodes are set to 'no' props. Return matches.
//  * Optionally resets all the NON matching nodes as well.
//  *
//  * If matched, we set `isFiltered` flag to true.
//  *
//  * Edges are matched if they link to the node.
//  *
//  * @param {String} keyToSet The template key of the node parameter we want to set,
//  *                          e.g. "label"
//  * @param {String} str The string to search for
//  * @param {Object} yes e.g. marked = { isFilteredOut: true };
//  * @param {Object} no e.g. normal = { isFilteredOut: false };
//  * @param {Bool} contains regex text contains or not contains
//  */
// function m_SetMatchingNodesKey(keyToSet, str = "", yes = {}, no = {}, contains = true) {
//   const D3DATA = UDATA.AppState("D3DATA"); // 8/10/20 REVIEW: Is this the best way to get current data?
//   let returnMatches = [];
//   str = NCLOGIC.EscapeRegexChars(str.trim());

//   const regex = new RegExp(/*'^'+*/ str, "i");
//   // First find the nodes
//   D3DATA.nodes.forEach(node => {
//     let nodeField = node[keyToSet];

//     // HACK
//     // The old data model has secondary keys stuffed
//     // into an `attributes` object.  This is a
//     // holdover from the original pre-netcreate
//     // data import.  If we ever change the data format
//     // this HACKMAP should be removed.
//     if (['type', 'info', 'notes'].includes(keyToSet)) {
//       nodeField = node.attributes[HACKMAP[keyToSet]];
//     }

//     let matches;
//     if (str === "") {
//       // empty string doesn't match anything
//       matches = false;
//     } else if (contains) {
//       matches = !regex.test(nodeField);
//     } else {
//       matches = regex.test(nodeField);
//     }

//     if (matches) {
//       console.log('......filtering out', node.label);
//       for (let key in yes) node[key] = yes[key];
//       returnMatches.push(node);
//     } else {
//       console.log('......unfiltering', node.label);
//       for (let key in no) node[key] = no[key];
//     }
//   });
//   // Then hide all related edges
//   m_SetMatchingEdgesByNodes(returnMatches, yes, no);
//   return returnMatches;
// }

// /**
//  * Set edges that link to any node in nodes to 'yes' props.
//  * All others nodes are set to 'no' props. Return matches.
//  *
//  * We set look for ALL nodes at once otherwise, one node can unset
//  * antoher node.
//  *
//  * This is a specialized function because edges need to be matched
//  * against both source and target.
//  *
//  * @param {Array} nodes Array of node objects
//  * @param {Object} yes e.g. marked = { isFilteredOut: true };
//  * @param {Object} no e.g. normal = { isFilteredOut: false };
//  */
// function m_SetMatchingEdgesByNodes(nodes, yes = {}, no = {}) {
//   const nodeIDs = nodes.map(node => node.id);
//   let returnMatches = [];
//   const D3DATA = UDATA.AppState("D3DATA");
//   D3DATA.edges.forEach(edge => {
//     if ( nodeIDs.includes(edge.source.id) || nodeIDs.includes(edge.target.id) ) {
//       for (let key in yes) edge[key] = yes[key];
//       returnMatches.push(edge);
//     } else {
//       for (let key in no) edge[key] = no[key];
//     }
//   });
//   return returnMatches;
// }


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
