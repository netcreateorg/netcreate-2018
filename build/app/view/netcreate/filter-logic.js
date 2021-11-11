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

/* JD added some global settins for filters
    Settings
      Transparency
        Nodes
        Edges

        NOTE: Default is hand-set to 0 for now, but this should be in a / the template
    */


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
  citation: "Citations",
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
    m_UpdateFilters();
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ FILTERS_UPDATE is called by FiltersPanel switches between filters and highlights
  /*/
  UDATA.HandleMessage("FILTERS_UPDATE", data => {
    const FDATA = UDATA.AppState("FDATA");
    FDATA.filterAction = data.filterAction;
    UDATA.SetAppState("FDATA", FDATA);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/     // Listen for D3DATA updates so we know to trigger change?
  /*/
  UDATA.OnAppStateChange('D3DATA',(data)=>{
    m_UpdateFilters();
  });


}); // end UNISYS_INIT


/// IMPORT FILTER DEFINITIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Loads filters from template file
 * NOTE: Setting transparency defaults here, which we shouldn't be
 */
function m_ImportFilters() {
  TEMPLATE = UDATA.AppState("TEMPLATE");

  let nodePrompts = TEMPLATE.nodePrompts;
  let edgePrompts = TEMPLATE.edgePrompts;

  let fdata = {
    nodes: {
      group: "nodes", // this needs to be passed to StringFilter
      label: "Node Filters",
      filters: m_ImportPrompts(nodePrompts),
      transparency: isNaN(nodePrompts.defaultTransparency)?0.2:nodePrompts.defaultTransparency // default to barely visible for backwards compatibility
    },
    edges: {
      group: "edges", // this needs to be passed to StringFilter
      label: "Edge Filters",
      filters: m_ImportPrompts(edgePrompts),
      transparency: isNaN(edgePrompts.defaultTransparency)?0.2:edgePrompts.defaultTransparency // default to barely visible for backwards compatibility
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
      case FILTER.TYPES.DATE:
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
  FDATA.filterAction = data.filterAction;
  if (data.group === "nodes") {

    if (data.type === "transparency")
    {
      FDATA.nodes.transparency = data.transparency;
    }
    else{
      let nodeFilters = FDATA.nodes.filters;
      const index = nodeFilters.findIndex(f => f.id === data.filter.id);
      nodeFilters.splice(index, 1, data.filter);
      FDATA.nodes.filters = nodeFilters;
    }
  } else if (data.group === "edges") {

    if (data.type === "transparency")
    {
      FDATA.edges.transparency = data.transparency;
    }
    else{
      let edgeFilters = FDATA.edges.filters;
      const index = edgeFilters.findIndex(f => f.id === data.filter.id);
      edgeFilters.splice(index, 1, data.filter);
      FDATA.edges.filters = edgeFilters;
    }
  }
  else {
    throw `FILTER_DEFINE called with unknown group: ${data.group}`;
  }
  UDATA.SetAppState("FDATA", FDATA);
}

/**
 * Walk down the list of filters and apply them all
 * @param {Object} data A UDATA pkt {defs}
 */
function m_FiltersApply() {
  const FILTERED_D3DATA = UDATA.AppState("D3DATA");
  const FDATA = UDATA.AppState("FDATA");

  // skip if FDATA has not been defined yet
  if (Object.keys(FDATA).length < 1) return;

  m_FiltersApplyToNodes(FDATA, FILTERED_D3DATA);
  m_FiltersApplyToEdges(FDATA, FILTERED_D3DATA);
  // Update FILTERED_D3DATA
  UDATA.Call("FILTERED_D3DATA", FILTERED_D3DATA);
}

function m_ClearFilters() {
  // Reload fdata
  const FDATA = clone(FDATA_RESTORE);
  UDATA.SetAppState("FDATA", FDATA);
}

function m_UpdateFilterSummary() {
  const FDATA = UDATA.AppState("FDATA");

  // skip if FDATA has not been defined yet
  if (Object.keys(FDATA).length < 1) return;

  const nodeFilters = FDATA.nodes.filters;
  const edgeFilters = FDATA.edges.filters;

  let summary = FDATA.filterAction === FILTER.ACTION.HIGHLIGHT
    ? 'HIGHLIGHTING ' : 'FILTERING ';
  summary += m_FiltersToString(FDATA.nodes.filters);
  summary += m_FiltersToString(FDATA.edges.filters);

  UDATA.LocalCall('FILTER_SUMMARY_UPDATE', { filtersSummary: summary });
}

function m_UpdateFilters() {
  m_FiltersApply();
  m_UpdateFilterSummary();
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
 *   FILTERED_D3DATA.nodes are updated with `isFilteredOut` flags.
 *
 * @param {Array} filters
 */
function m_FiltersApplyToNodes(FDATA, FILTERED_D3DATA) {
  const { filterAction } = FDATA;
  const { filters, transparency } = FDATA.nodes;
  FILTERED_D3DATA.nodes = FILTERED_D3DATA.nodes.filter(node => {
    return m_FiltersApplyToNode(node, filters, transparency, filterAction);
  });
}

function m_FiltersApplyToNode(node, filters, transparency, filterAction) {
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
    // all filters are "no_op", so no filters defined, don't filter anything
    node.filteredTransparency = 1.0; // opaque, not tranparent
  } else {
    // node is filtered out if it fails any filter tests
    if (!matched) {
      node.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    } else {
      node.filteredTransparency = 1.0; // opaque
    }
  }

  // FILTER.ACTION.FILTER
  if (filterAction === FILTER.ACTION.FILTER) {
    if (matched) return true;
    return false;
  }

  // FILTER.ACTION.HIGHLIGHT, so don't filter
  return true;
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
      return m_MatchNumber(filter.operator, filter.value, nodeValue)
      break;
  }
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EDGE FILTERS
/*/

function m_FiltersApplyToEdges(FDATA, FILTERED_D3DATA) {
  const { filterAction } = FDATA;
  const { filters, transparency } = FDATA.edges;
  FILTERED_D3DATA.edges = FILTERED_D3DATA.edges.filter(edge => {
    return m_FiltersApplyToEdge(edge, filters, transparency, filterAction);
  });
}

function m_FiltersApplyToEdge(edge, filters, transparency, filterAction) {
  let all_no_op = true;
  let matched = true;
  if (edge.source.filteredTransparency < 1.0 || edge.target.filteredTransparency < 1.0) {
    // regardless of filter definition,
    // always hide edge if it's attached to a filtered node
    // FILTER.ACTION.FILTER
    if (filterAction === FILTER.ACTION.FILTER) return false;
    // else
    // FILTER.ACTION.HIGHLIGHT, so don't filter, just fade
    edge.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    return true;
  }

  // otherwise, look for matches
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
    edge.filteredTransparency = 1.0;
  } else {
    // edge is filtered out if it fails ANY filter tests
    if (!matched) {
      edge.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    } else {
      edge.filteredTransparency = 1.0; // opaque
    }
  }


  // FILTER.ACTION.FILTER
  if (filterAction === FILTER.ACTION.FILTER) {
    if (matched) return true;
    return false;
  }

  // FILTER.ACTION.HIGHLIGHT, so don't filter
  return true;
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
