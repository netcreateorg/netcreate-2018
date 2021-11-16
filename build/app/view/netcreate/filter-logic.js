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

  * See Whimiscal [diagram](https://whimsical.com/d3-data-flow-B2tTGnQYPSNviUhsPL64Dz)

  * filterAction: "Highlight" vs "Filter"
    --  Version 1.4 introduces two different types of filtering:
        "Highlight" highlights the matching nodes/edges and fades the others
        "Filter" shows matching nodes/edges and removes the non-matching
        nodes/edges from the display without affecting the underlying data.

  * With Version 1.4, the only data that is graphed is FILTERED_D3DATA.
    --  d3-simplenetgraph no longer plots on D3DATA changes.
    --  Instead, FILTERED_D3DATA changes are pushed via an AppCall.
    --  This way there is only one source of truth: all draw updates
        are routed through filter-logic.
    --  If filters have not been defined, we just pass the raw D3DATA

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
  const FILTEREDD3DATA = UDATA.AppState("D3DATA");
  const FDATA = UDATA.AppState("FDATA");

  // skip if FDATA has not been defined yet
  if (Object.keys(FDATA).length < 1) return;

  m_FiltersApplyToNodes(FDATA, FILTEREDD3DATA);
  m_FiltersApplyToEdges(FDATA, FILTEREDD3DATA);
  // Update FILTEREDD3DATA
  UDATA.SetAppState("FILTEREDD3DATA", FILTEREDD3DATA);

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

  const typeSummary = FDATA.filterAction === FILTER.ACTION.HIGHLIGHT
    ? 'HIGHLIGHTING ' : 'FILTERING ';
  const nodeSummary = m_FiltersToString(FDATA.nodes.filters);
  const edgeSummary = m_FiltersToString(FDATA.edges.filters);
  let summary = '';
  if (nodeSummary || edgeSummary) summary = `${typeSummary} NODES: ${nodeSummary} EDGES: ${edgeSummary}`;

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
 *   FILTEREDD3DATA.nodes are updated with `isFilteredOut` flags.
 *
 * @param {Array} filters
 */
function m_FiltersApplyToNodes(FDATA, FILTEREDD3DATA) {
  const { filterAction } = FDATA;
  const { filters, transparency } = FDATA.nodes;
  FILTEREDD3DATA.nodes = FILTEREDD3DATA.nodes.filter(node => {
    return m_NodeIsFiltered(node, filters, transparency, filterAction);
  });
}

function m_NodeIsFiltered(node, filters, transparency, filterAction) {
  // let all_no_op = true;
  let keepNode = true;

  // 1. Look for matches
  // implicit AND.  ALL filters must return true.
  filters.forEach(filter => {
    if (filter.operator === FILTER.OPERATORS.NO_OP.key) return; // skip no_op
    // all_no_op = false;
    if (!m_IsNodeMatchedByFilter(node, filter)) {
      keepNode = false;
    }
  });

  // 2. Decide based on filterAction
  if (filterAction === FILTER.ACTION.FILTER) {
    // not using highlight, so restore transparency
    node.filteredTransparency = 1.0; // opaque, not tranparent
    if (keepNode) return true;
    return false; // remove from array
  } else {
    // FILTER.ACTION.HIGHLIGHT
    if (!keepNode) {
      node.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    } else {
      node.filteredTransparency = 1.0; // opaque
    }
    return true; // don't filter out
  }

  // all_no_op
  // Thjs is currently redundant because matchesFilter will always
  // be true if there are no filters.  If matchesFilter is true,
  // then the node will not be removed/faded.
  //
  // if (all_no_op) {
  //   // all filters are "no_op", so no filters defined, don't filter anything
  //   node.filteredTransparency = 1.0; // opaque, not tranparent
  // }
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

function m_FiltersApplyToEdges(FDATA, FILTEREDD3DATA) {
  const { filterAction } = FDATA;
  const { filters, transparency } = FDATA.edges;
  FILTEREDD3DATA.edges = FILTEREDD3DATA.edges.filter(edge => {
    return m_EdgeIsFiltered(edge, filters, transparency, filterAction, FILTEREDD3DATA);
  });
}

/*/ Side effect: Sets `isFiltered`
/*/
function m_EdgeIsFiltered(edge, filters, transparency, filterAction, FILTEREDD3DATA) {
  // let all_no_op = true; // all filters are no_op
  let keepEdge = true;

  const source = FILTEREDD3DATA.nodes.find(e => e.id === edge.source.id);
  const target = FILTEREDD3DATA.nodes.find(e => e.id === edge.target.id);
  // 1. if source or target is filtered, then we are filtered too
  if (source === undefined || target === undefined ||
    source.filteredTransparency < 1.0 ||
    target.filteredTransparency < 1.0) {
    // regardless of filter definition...
    // ...if filterAction is FILTER
    // always hide edge if it's attached to a filtered node
    if (filterAction === FILTER.ACTION.FILTER) return false;
    // ...else if filterAction is HIGHLIGHT
    // don't filter, just fade
    edge.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    return true;
  }

  // 2. otherwise, look for matches
  // implicit AND.  ALL filters must return true.
  // edge is filtered out if it fails ANY filter tests
  filters.forEach(filter => {
    if (filter.operator === FILTER.OPERATORS.NO_OP.key) return; // skip no_op
    // Found a filter!  Apply it!
    // all_no_op = false;
    if (!m_IsEdgeMatchedByFilter(edge, filter)) {
      keepEdge = false;
    }
  });

  // 3. Decide how to filter based on filterAction
  if (filterAction === FILTER.ACTION.FILTER) {
    // not using highlight, so restore transparency
    edge.filteredTransparency = 1.0; // opaque
    if (keepEdge) return true; // keep in array
    return false; // remove from array
  } else {
    // FILTER.ACTION.HIGHLIGHT, so don't filter
    if (!keepEdge) {
      edge.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    } else {
      edge.filteredTransparency = 1.0; // opaque
    }
    return true; // always keep in array
  }

  // all_no_op
  // This is currently redundant because matchesFilter will always
  // be true if there are no filters.  If matchesFilter is true,
  // then the node will not be removed/faded.
  //
  // if (all_no_op) {
  //   // no filters defined, undo isFilteredOut
  //   edge.filteredTransparency = 1.0;
  // } else {
  // }
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
