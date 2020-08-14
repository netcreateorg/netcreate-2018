/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTER LOGIC


  Filter Definitions

  The initial filter definitions are loaded from the current database template.


    FDATA = {
        nodes: {                    // group
            label: "Node Filters",  // group label
            filters: [              // array of filter objects
                {
                  id: '4',
                  type: 'string',
                  key: 'label',
                  keylabel: 'Label',
                  operator: 'no-op',
                  value: ''
                },
                {
                  id: '2',
                  type: 'select',
                  key: 'type',
                  keylabel: 'Type',
                  operator: 'no-op',
                  value: ''
                },
                ...
            ]
        },
        edges: {
            label: "Edge Filters",
            filters: [...]
        }
    }


  FEATURES

  * Filters can be stacked.
        You can define two "Label" filters, for example.
        The only reason you can't do it right now is because the filter template
        is reading directly from the _default.template file.  You can easily
        insert another filter into the mix programmatically.  So



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import FILTER from './components/filter/FilterEnums';
const UNISYS = require("unisys/client");
const clone = require("rfdc")();

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// APP STATE/DATA STRUCTURES /////////////////////////////////////////////////
const PROMPTS = require("system/util/prompts");
const NCLOGIC = require("./nc-logic");

var TEMPLATE = null; // template definition for prompts
var FDATA_RESTORE; // pristine FDATA for clearing

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DATASET = window.NC_CONFIG.dataset || "netcreate";
const TEMPLATE_URL = `templates/${DATASET}.json`;

const DBG = false;
const PR = "filter-logic: ";


const HACKMAP_NODES = { // Map to convert old 'attributes' data formats.
  type: "Node_Type",    // Used in m_IsNodeMatchedByFilter
  info: "Extra Info",
  notes: "Notes"
}
const HACKMAP_EDGES = { // Map to convert old 'attributes' data formats.
  type: "Relationship", // Used in m_IsEdgeMatchedByFilter
  category: "Category",
  citations: "Citations",
  info: "Info",
  notes: "Notes"
}

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {

  UDATA.OnAppStateChange("TEMPLATE", data => {
    m_ImportFilters();
  });

  UDATA.OnAppStateChange("FDATA", data => {
    if (DBG) console.log(PR + 'OnAppStateChange: FDATA', data);
    // The filter defs have been updated, so apply the filters.
    m_FiltersApply();
    m_UpdateFilterSummary();
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

  // Save off a copy for clearing the form.
  FDATA_RESTORE = clone(fdata);
}

function m_ImportPrompts(prompts) {
  let filters = [];
  let counter = 0;
  for (const [key, prompt] of Object.entries(prompts)) {
    let operator;
    switch (prompt.type) {
      case FILTER.TYPES.STRING:
        operator = FILTER.OPERATORS.NO_OP.key; // default to no_op
        break;
      case FILTER.TYPES.NUMBER:
        operator = FILTER.OPERATORS.NO_OP.key; // default to no_op
        break;
      case FILTER.TYPES.SELECT:
        operator = FILTER.OPERATORS.NO_OP.key; // default to no_op
        break;
      case FILTER.TYPES.NODE:
        operator = FILTER.OPERATORS.NO_OP.key; // default to no_op
        break;
      case FILTER.TYPES.HIDDEN:
        break;
      default:
        // edge template item "edgeIsLockedMessage" will trigger this message
        // filters will not be created for entries with no `type` defined.
        if (DBG) console.warn(PR + `Unknown node prompt type ${prompt.type} for ${prompt}`);
        break;
    }
    if (operator === undefined) continue; // don't add filter if operator is hidden
    if (prompt.hidden) continue; // don't add filter if "hidden": true
    let filter = {
      id: counter++,
      key: key,
      type: prompt.type,
      keylabel: prompt.label,
      operator: operator,
      value: ''
    };

    // Add "Options" for "select" filter types
    if (prompt.type === FILTER.TYPES.SELECT) {
      let options = [];
      prompt.options.forEach(opt => {
        if (opt.label === "") return;
        options.push(opt.label);
      })
      filter.options = options;
    }

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
  const FDATA = UDATA.AppState("FDATA");
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
  UDATA.SetAppState("FDATA", FDATA);
}

/**
 * Walk down the list of filters and apply them all
 * @param {Object} data A UDATA pkt {defs}
 */
function m_FiltersApply() {
  const FDATA = UDATA.AppState("FDATA");
  m_FiltersApplyToNodes(FDATA.nodes.filters);
  m_FiltersApplyToEdges(FDATA.edges.filters);
}

function m_ClearFilters() {
  // Reload fdata
  const FDATA = clone(FDATA_RESTORE);
  UDATA.SetAppState("FDATA", FDATA);
}

function m_UpdateFilterSummary() {
  const FDATA = UDATA.AppState("FDATA");

  const nodeFilters = FDATA.nodes.filters;
  const edgeFilters = FDATA.edges.filters;

  let summary = '';
  summary += m_FiltersToString(FDATA.nodes.filters);
  summary += m_FiltersToString(FDATA.edges.filters);

  UDATA.LocalCall('FILTER_SUMMARY_UPDATE', { filtersSummary: summary });
}

function m_FiltersToString(filters) {
  let summary = ''
  filters.forEach(filter => {
    if ((filter.operator === undefined) ||
      (filter.value === undefined) ||
      (filter.value === '')) return;
    summary += filter.keylabel + ' ';
    summary += m_OperatorToString(filter.operator) + ' ';
    summary += '"' + filter.value + '"; ';
  });
  return summary;
}
function m_OperatorToString(operator) {
  return FILTER.OPERATORS[operator].label;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY FUNCTIONS
/*/

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

function m_MatchNumber(operator, filterVal, objVal) {
  let matches;
  if (filterVal === "") {
    matches = true;
  } else {
    switch (operator) {
      case FILTER.OPERATORS.GT.key:
        matches = objVal > filterVal;
        break;
      case FILTER.OPERATORS.GT_EQ.key:
        matches = objVal >= filterVal;
        break;
      case FILTER.OPERATORS.LT.key:
        matches = objVal < filterVal;
        break;
      case FILTER.OPERATORS.LT_EQ.key:
        matches = objVal <= filterVal;
        break;
      case FILTER.OPERATORS.EQ.key:
        matches = objVal === filterVal;
        break;
      case FILTER.OPERATORS.NOT_EQ.key:
        matches = objVal !== filterVal;
        break;
      default:
        console.error(`filter-logic.js: Unknown operator ${operator}`);
        break;
    }
  }
  return matches;
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
    if (filter.operator === FILTER.OPERATORS.NO_OP.key) return; // skip no_op
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

  let nodeValue;
  // HACK
  // The old data model has secondary keys stuffed
  // into an `attributes` object.  This is a
  // holdover from the original pre-netcreate
  // data import.  If we ever change the data format
  // this HACKMAP should be removed.
  if (['type', 'info', 'notes'].includes(filter.key)) {
    nodeValue = node.attributes[HACKMAP_NODES[filter.key]];
  } else {
    nodeValue = node[filter.key];
  }
  switch (filter.operator) {
    case FILTER.OPERATORS.CONTAINS.key:
      return m_MatchString(filter.value, nodeValue, true);
      break;
    case FILTER.OPERATORS.NOT_CONTAINS.key:
      return m_MatchString(filter.value, nodeValue, false);
      break;
    default:
      // Else assume it's a number
      console.log('NUMBER', filter, node);
      return m_MatchNumber(filter.operator, filter.value, nodeValue)
      break;
  }
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
    if (filter.operator === FILTER.OPERATORS.NO_OP.key) return; // skip no_op
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

  let edgeValue;
  if (filter.type === FILTER.TYPES.NODE) {
    // edges require special handling because `source` and `target`
    // point to node objects, not simple strings.
    edgeValue = edge[filter.key].label; // search on the source/target node label
  } else {
    // HACK
    // The old data model has secondary keys stuffed
    // into an `attributes` object.  This is a
    // holdover from the original pre-netcreate
    // data import.  If we ever change the data format
    // this HACKMAP should be removed.
    if (['category','citation','info','notes','type'].includes(filter.key)) {
      edgeValue = edge.attributes[HACKMAP_EDGES[filter.key]];
    } else {
      edgeValue = edge[filter.key];
    }
  }

  switch (filter.operator) {
    case FILTER.OPERATORS.CONTAINS.key:
      return m_MatchString(filter.value, edgeValue, true);
      break;
    case FILTER.OPERATORS.NOT_CONTAINS.key:
      return m_MatchString(filter.value, edgeValue, false);
      break;
    default:
      // Else assume it's a number
      return m_MatchNumber(filter.operator, filter.value, edgeValue)
      break;
  }
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
