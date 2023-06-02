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
        focus: {
          source: undefined,
          sourceLabel: '',
          range: 1
        }
    }


  FEATURES

  * See Whimiscal [diagram](https://whimsical.com/d3-data-flow-B2tTGnQYPSNviUhsPL64Dz)

  * filterAction: "Highlight" vs "Filter"
    --  Version 1.4 introduces two different types of filtering:
        "Highlight" highlights the matching nodes/edges and fades the others
        "Filter" shows matching nodes/edges and removes the non-matching
        nodes/edges from the display without affecting the underlying data.

  * With Version 1.4, the only data that is graphed is FILTEREDD3DATA.
    --  d3-simplenetgraph no longer plots on NCDATA changes.
    --  Instead, it plots the new FILTEREDD3DATA state.  Whenever NCDATA changes,
        FILTERDD3DATA is udpated.
    --  This way there is only one source of truth: all draw updates
        are routed through filter-logic.
    --  If filters have not been defined, we just pass the raw NCDATA

  * Filters can be stacked.
        You can define two "Label" filters, for example.
        The only reason you can't do it right now is because the filter template
        is reading directly from the _default.template file.  You can easily
        insert another filter into the mix programmatically.



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
const UTILS = require("./nc-utils");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// APP STATE/DATA STRUCTURES /////////////////////////////////////////////////
const PROMPTS = require("system/util/prompts");
const NCLOGIC = require("./nc-logic");

var TEMPLATE = null; // template definition for prompts
var FDATA_RESTORE; // pristine FDATA for clearing

let NODE_DEFAULT_TRANSPARENCY;
let EDGE_DEFAULT_TRANSPARENCY;

let RemovedNodes = []; // nodes removed via COLLAPSE filter action

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DATASET = window.NC_CONFIG.dataset || "netcreate";
const TEMPLATE_URL = `templates/${DATASET}.json`;

const DBG = false;
const PR = "filter-logic: ";

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {

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
    // if the Focus panel is being selected, grab update the selection so that
    // the selected node is immediately focused on (otherwise the system ignores
    // the currently selecte dnode and you have to click on it again)
    if (data.filterAction === FILTER.ACTION.FOCUS) {
      const SELECT = UDATA.AppState("SELECTION");
      const selectedNode = SELECT.nodes ? SELECT.nodes[0] : undefined;
      if (selectedNode) {
        FDATA.focus = {
          source: selectedNode.id,
          sourceLabel: selectedNode.label,
          range: FDATA.focus.range
        };
      }
    }
    UDATA.SetAppState("FDATA", FDATA);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Listen for NCDATA updates so we know to trigger change?
  /*/
  UDATA.OnAppStateChange('NCDATA', (data) => {
    m_UpdateFilters();
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Listen for TEMPLATE updates so we know to trigger change?
  /*/
  UDATA.OnAppStateChange("TEMPLATE", data => {
    // this is critical -- graph will not draw if this is
    // not called from nc-logic.LOADASSETS
    m_ImportFilters();
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ 2023-06 Interim Approach -- eventually should convert to new selection mgr
      Listen for SELECTION changes for setting Focus
  /*/
  UDATA.OnAppStateChange("SELECTION", data => {
    // Only if Focus is active
    const FDATA = UDATA.AppState("FDATA");
    if (FDATA.filterAction === FILTER.ACTION.FOCUS) {
      m_SetFocus(data);
    }
  });

}); // end UNISYS_INIT


/// IMPORT FILTER DEFINITIONS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Loads filters from template file
 */
function m_ImportFilters() {
  TEMPLATE = UDATA.AppState("TEMPLATE");
  const nodeDefs = TEMPLATE.nodeDefs;
  const edgeDefs = TEMPLATE.edgeDefs;
  NODE_DEFAULT_TRANSPARENCY = TEMPLATE.nodeDefaultTransparency;
  EDGE_DEFAULT_TRANSPARENCY = TEMPLATE.edgeDefaultTransparency;

  let fdata = {
    nodes: {
      group: "nodes", // this needs to be passed to StringFilter
      label: "Node Filters",
      filters: m_ImportPrompts(nodeDefs),
      transparency: 0.2 // Default transparency form for Highlight should be 0.2, not template default which is usu 1.0
    },
    edges: {
      group: "edges", // this needs to be passed to StringFilter
      label: "Edge Filters",
      filters: m_ImportPrompts(edgeDefs),
      transparency: 0.03 // Default transparency form for Highlight should be 0.03, not template default which is usu 0.3
    },
    focus: {
      source: undefined, // nothing focused by default
      sourceLabel: '',
      range: 1
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
      keylabel: prompt.displayLabel,
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
  FDATA.filterAction = data.filterAction || FDATA.filterAction; // if 'transparency' then filterAction is not passed, so default to existing
  if (data.group === "nodes") {

    if (data.type === "transparency") {
      FDATA.nodes.transparency = data.transparency;
    } else {
      let nodeFilters = FDATA.nodes.filters;
      const index = nodeFilters.findIndex(f => f.id === data.filter.id);
      nodeFilters.splice(index, 1, data.filter);
      FDATA.nodes.filters = nodeFilters;
    }
  } else if (data.group === "edges") {

    if (data.type === "transparency") {
      FDATA.edges.transparency = data.transparency;
    } else {
      let edgeFilters = FDATA.edges.filters;
      const index = edgeFilters.findIndex(f => f.id === data.filter.id);
      edgeFilters.splice(index, 1, data.filter);
      FDATA.edges.filters = edgeFilters;
    }
  } else if (data.group === "focus") {
    FDATA.focus.range = data.filter.value;
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
  const FILTEREDD3DATA = UDATA.AppState("NCDATA");
  const FDATA = UDATA.AppState("FDATA");

  // skip if FDATA has not been defined yet
  if (Object.keys(FDATA).length < 1) return;

  // stuff 'sourceLabel' and 'targetLabel' into edges for quicker filtering
  // otherwise we have to constantly look up the node label
  FILTEREDD3DATA.edges = FILTEREDD3DATA.edges.map(e => {
    const source = FILTEREDD3DATA.nodes.find(n => n.id === e.source);
    const target = FILTEREDD3DATA.nodes.find(n => n.id === e.target);
    e.sourceLabel = source ? source.label : 'deleted';
    e.targetLabel = target ? target.label : 'deleted';
    return e;
  })

  m_FiltersApplyToNodes(FDATA, FILTEREDD3DATA);
  m_FiltersApplyToEdges(FDATA, FILTEREDD3DATA);

  // REVIEW 2023-0530
  // -- If "Filter/Hide" functionality is going to be kept, this needs to be reworked!
  //    We SHOULD NOT recalculate sizes in "Filter/Hide" mode, otherwise, the size will change.
  //
  // Recalculate sizes
  // ALWAYS recalculate, e.g. if switching from Collapse to Highlight or clearing data
  UTILS.RecalculateAllEdgeSizes(FILTEREDD3DATA);
  UTILS.RecalculateAllNodeDegrees(FILTEREDD3DATA);

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

  const typeSummary = FDATA.filterAction; // text for filter action is the label, e.g. 'HIGHLIGHT'
  const nodeSummary = m_FiltersToString(FDATA.nodes.filters);
  const edgeSummary = m_FiltersToString(FDATA.edges.filters);
  let summary = '';
  if (nodeSummary || edgeSummary) summary =
    `${typeSummary} ${nodeSummary ? 'NODES: ' : ''}${nodeSummary} ${edgeSummary ? 'EDGES: ' : ''}${edgeSummary}`;

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
  RemovedNodes = [];

  // if current filter is focus, calculate bacon_values
  if (FDATA.filterAction === FILTER.ACTION.FOCUS) m_FocusPrep(FDATA, FILTEREDD3DATA);

  FILTEREDD3DATA.nodes = FILTEREDD3DATA.nodes.filter(node => {
    return m_NodeIsFiltered(node, FDATA);
  });
}

function m_NodeIsFiltered(node, FDATA) {
  const { filterAction } = FDATA;
  const { filters, transparency } = FDATA.nodes;
  const { source, range } = FDATA.focus;

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
  node.isFiltered = false; // always reset if not HIGHLIGHT
  node.filteredTransparency = NODE_DEFAULT_TRANSPARENCY; // always reset if not HIGHLIGHT
  if (filterAction === FILTER.ACTION.FILTER) {
    // not using highlight, so restore transparency
    if (keepNode) return true;
    return false; // remove from array
  } else if (filterAction === FILTER.ACTION.HIGHLIGHT) {
    if (!keepNode) {
      node.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    }
    return true; // don't filter out
  } else if (filterAction === FILTER.ACTION.COLLAPSE) {
    if (keepNode) return true; // matched, so keep
    // filter out (remove) and add to `RemovedNodes` for later removal of linked edge
    RemovedNodes.push(node.id);
    return false;
  } else if (filterAction === FILTER.ACTION.FOCUS) {
    // Remove nodes outside of range
    if (source !== undefined && (node.bacon_value === undefined || node.bacon_value > range)) {
      RemovedNodes.push(node.id);
      return false;
    }
    return true;
  } else {
    // no filter, keep the node!
    return true;
  }

  // all_no_op
  // This is currently redundant because matchesFilter will always
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

  const nodeValue = node[filter.key];

  switch (filter.operator) {
    case FILTER.OPERATORS.CONTAINS.key:
      return m_MatchString(filter.value, nodeValue, true);
      break;
    case FILTER.OPERATORS.NOT_CONTAINS.key:
      return m_MatchString(filter.value, nodeValue, false);
      break;
    case FILTER.OPERATORS.IS_EMPTY.key:
      return nodeValue === undefined || nodeValue === '';
      break;
    case FILTER.OPERATORS.IS_NOT_EMPTY.key:
      return nodeValue !== undefined && nodeValue !== '';
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
  if (!FILTEREDD3DATA.edges) return; // no data
  FILTEREDD3DATA.edges = FILTEREDD3DATA.edges.filter(edge => {
    return m_EdgeIsFiltered(edge, filters, transparency, filterAction, FILTEREDD3DATA);
  });
}

/*/ Side effect: Sets `isFiltered`
/*/
function m_EdgeIsFiltered(edge, filters, transparency, filterAction, FILTEREDD3DATA) {
  // let all_no_op = true; // all filters are no_op
  let keepEdge = true;
  const source = FILTEREDD3DATA.nodes.find(e => {
    // on init, edge.source is just an id.  only with d3 processing does it
    // get transformed into a node object.  so we have to check the type.
    const sourceId = (typeof edge.source === 'number') ? edge.source : edge.source.id;
    return e.id === sourceId;
  });
  const target = FILTEREDD3DATA.nodes.find(e => {
    // on init, edge.target is just an id.  only with d3 processing does it
    // get transformed into a node object.  so we have to check the type.
    const targetId = (typeof edge.target === 'number') ? edge.target : edge.target.id;
    return e.id === targetId;
  });

  // 1. If source or target are missing, then remove the edge
  if (source === undefined || target === undefined ) return false;

  // 2. If source or target have been removed via collapse or focus, remove the edge
  if (RemovedNodes.includes(source.id) || RemovedNodes.includes(target.id)) return false;
  // 3. if source or target is transparent, then we are transparent too
  if ( source.filteredTransparency < 1.0 ||
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

  // 4. otherwise, look for matches
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
    // FILTER!
    // not using highlight, so restore transparency
    edge.filteredTransparency = EDGE_DEFAULT_TRANSPARENCY; // opaque
    if (keepEdge) return true; // keep in array
    return false; // remove from array
  } else if (filterAction === FILTER.ACTION.HIGHLIGHT) {
    if (!keepEdge) {
      edge.filteredTransparency = transparency; // set the transparency value ... right now it is inefficient to set this at the node / edge level, but that's more flexible
    } else {
      edge.filteredTransparency = EDGE_DEFAULT_TRANSPARENCY; // opaque
    }
    return true; // always keep in array
  } else if (filterAction === FILTER.ACTION.COLLAPSE) {
    if (keepEdge) return true; // matched, so keep
    // else filter out (remove)
    return false;
  } else {
    // keep by default if no filter
    return true;
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
    // edges fields that poitn to nodes require special handling because `source` and `target`
    // point to node objects, not simple strings.
    if (filter.key === 'source') edgeValue = edge.sourceLabel;
    if (filter.key === 'target') edgeValue = edge.targetLabel;
  } else {
    edgeValue = edge[filter.key];
  }

  switch (filter.operator) {
    case FILTER.OPERATORS.CONTAINS.key:
      return m_MatchString(filter.value, edgeValue, true);
      break;
    case FILTER.OPERATORS.NOT_CONTAINS.key:
      return m_MatchString(filter.value, edgeValue, false);
      break;
    case FILTER.OPERATORS.IS_EMPTY.key:
      return edgeValue === undefined || edgeValue === '';
      break;
    case FILTER.OPERATORS.IS_NOT_EMPTY.key:
      return edgeValue !== undefined && edgeValue !== '';
      break;
    default:
      // Else assume it's a number
      return m_MatchNumber(filter.operator, filter.value, edgeValue)
      break;
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ FOCUS FILTERS
/*/

/**
 * Returns an Map of node ids that are directly connected to the passed `nodeId`
 * Uses a Map so there are no redundancies.
 * A more efficient search targeted on looking up nodes
 * @param {object} puredata Raw/pure data from NCData
 * @param {array} puredata.nodes
 * @param {array} puredata.edges where edge.source and edge.target are numeric ids
 * @param {string} nodeId The source nodeId to start the search from
 * @returns {map} Map of matching nodeIds {number}
 */
function m_FindConnectedNodeIds(puredata, nodeId) {
  let returnMatches = new Map();
  puredata.edges.forEach(edge => {
    if (edge.source === nodeId) returnMatches.set(edge.target, nodeId); // nodeId in returnMatches is not necessary
    if (edge.target === nodeId) returnMatches.set(edge.source, nodeId);
  })
  return returnMatches;
}


/**
 * Recursively walks down the network starting from the sourceNodes
 * There can be more than one sourceNodes, e.g. this can set values starting with any number of nodes
 * Modifies puredata by reference
 * @param {object} puredata {nodes, edges}
 * @param {array} sourceNodes {string}
 * @param {number} range
 */
function m_SetBaconValue(bacon_value, max_bacon_value, puredata, sourceNodes) {
  if (bacon_value > max_bacon_value) return;
  sourceNodes.forEach(source => {
    const newNodes = []; // collect new nodes that we need to walk down
    const connectedNodeIds = m_FindConnectedNodeIds(puredata, source); // map
    puredata.nodes = puredata.nodes.map(node => {
      if (node.bacon_value !== undefined) return node; // skip bacon_value if ready set

      if (node.id === source) {
        node.bacon_value = 0; // the focused node has a value of 0
      } else if (connectedNodeIds.has(node.id)) {
        node.bacon_value = bacon_value;
        newNodes.push(node.id);
      }
      return node; // returns node with updated bacon_value
    });

    // recursive call
    if (newNodes.length > 0 && bacon_value + 1 <= max_bacon_value) m_SetBaconValue(bacon_value + 1, max_bacon_value, puredata, newNodes);
  });
}

/**
 * Prepares `puredata` (aka FILTEREDD3DATA) for filtering by
 * seeding node data with "degrees of separation" (aka "bacon_value") from the selected node
 * Uses FDATA specifications for the focus selection and range
 * Modifies puredata by reference
 * This should generally be called right before filtering is applied
 * @param {*} FDATA
 * @param {*} puredata
 */
function m_FocusPrep(FDATA, puredata) {
  const { source, range } = FDATA.focus;
  // first clear bacon_value
  puredata.nodes = puredata.nodes.map(node => {
    node.bacon_value = undefined;
    return node;
  })
  if (range < 1) {
    return; // show all if range=0
  }
  // Then set bacon_value
  // Initiate the crawl starting at 1 with the source node
  m_SetBaconValue(1, range, puredata, [source]);
}

/**
 * Called when SELECTION appState changes, e.g. user has clicked on a node
 * while in FOCUS View.
 * @param {object} data
 * @param {array} data.nodes array of node objects
 */
function m_SetFocus(data) {
  const selectedNode = data.nodes[0];
  const selectedNodeId = selectedNode ? selectedNode.id : undefined;
  const selectedNodeLabel = selectedNode ? selectedNode.label : '';

  // Set FDATA
  const FDATA = UDATA.AppState("FDATA");
  FDATA.focus = {
    source: selectedNodeId,
    sourceLabel: selectedNodeLabel,
    range: FDATA.focus.range
  };
  UDATA.SetAppState("FDATA", FDATA);

  // Actual filtering is done by m_FiltersApply call after FDATA change
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
