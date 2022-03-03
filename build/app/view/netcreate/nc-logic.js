/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  * EVENTS: D3 Graph Updates

    Mark Node/Edge          Nodes in the graph are marked via a stroke around
                            the circle.  There are two types of marks:

                            1. SEARCH -- when a node matches a search, its
                            strokeColor is set to green.

                            2. SELECTION -- when a node is selected by the
                            user and shown in the NodeSelector either by
                            directly clicking on it or by clicking on a
                            item in the search suggestion list, the node
                            data is marked `selected` and a blue strokeColor
                            is applied.

                            The two marks are orthogonal to each other: a
                            node can be both searched and selected, though
                            the selection mark will override the search
                            mark.

                            The rendering is handled by modifying the
                            node data in D3DATA.  d3-simplenetgraph will
                            then read any D3DATA updates and redraw
                            the graph based on the updated data.

    Add New Node/Edge       When the user adds a new edge or node, handlers in
                            NetCreate will update its `this.state.data`
                            with the new nodes/edges.  This is passed on to
                            `NetGraph.jsx` and in turn to `D3SimpleNetGraph.js`
                            which will display the new data during its update
                            cycle.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = require("settings");
const UNISYS = require("unisys/client");
const JSCLI = require("system/util/jscli");
const D3 = require("d3");
const EXPORT = require("./export-logic");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// APP STATE/DATA STRUCTURES /////////////////////////////////////////////////
/*/ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \*\


    SELECTION

    The SELECTION state maintains the list of nodes and edges that are
    currently selected and loaded in the forms.

    Set by      AutoComplete's call to SOURCE_SELECT
                D3SimpleNetGraph's call to SOURCE_SELECT
                EdgeEditor's call to EDGE_UPDATE
    Handled by  NodeSelector to load the currently selected node
                NodeSelector also sets the edges in EdgeEditor
                EdgeEditor to select the target node when creating new edge

    * nodes     An array of current selected nodes for editing.
                This is the node the user clicked on in the graph or selected from
                the suggestions list
    * edges     An array of edge objects for editing
                *REVIEW*: Should this be renamed "selectedEdges" to distinguish from
                *D3DATA.edge



    SEARCH

    The SEARCH state keeps track of the text being searched for in the
    main AutoComplete field.  It also provides a list of the nodes that match
    the search string so that AutoComplete and D3 can display them.  (D3
    doesn't actually process the SEARCH state change.  Instead it's processed
    by nc-logic in response to SOURCE_SEARCH calls -- nc-logic
    will set the node's `selected` or `stroke-color` state if a node
    is currently selected or matches a search parameter, respectively.)

    Set by      AutoComplete's call to SOURCE_SEARCH when its input changes.
    Handled by  AutoComplete for its controlled input field
                NodeSelector for validating when editing the form.

    * searchLabel     A string that the user has typed into AutoComplete
    * suggestedNodes  An array of nodes that match the searchLabel



    ACTIVEAUTOCOMPLETE

    The ACTIVEAUTOCOMPLETE state points to the id of the AutoComplete
    field (either search, or NodeSElector, or EdgeEditor) that has the
    current focus.  Search results and d3 clicks are routed to the
    active AutComplete component.

    Set by      Search's call to AUTOCOMPLETE_SELECT on startup
                NodeSelector's call to AUTOCOMPLETE_SELECT when Edit Node is clicked
                " when changes are submitted
                EdgeEditor's call to AUTOCOMPLETE_SELECT when a new Edge is created
                " an edge is selected externally for editing
                " an edge being editted is closed (hand back to search)
                " changes are submitted

    Handled by  AutoComplete to enable/disable its mode active state,
                know when and when not to handle SEARCH and SELECTION state updates.

    Looked up   NodeSelector to check if it's the current activeAutoCompleteId

    * activeAutoCompleteId
                id of active <AutoComplete> field
                of form: 'node-xx' or 'edge-source-xx' or 'edge-target-xx'
                where xx = the id of the <AutoComplete> field that has input focus.
                This is used to keep track of the currently active
                AutoComplete field. Inactive fields and updates are determined by
                the value of this property.


    D3DATA

    * nodes: all nodes (not all may be actually changed)
    * edges: all edges (not all may be actually changed)


\*\ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -/*/
var D3DATA = null; // see above for description
var TEMPLATE = null; // template definition for prompts
const NETWORK = require("unisys/client-network");
const DATASTORE = require("system/datastore");
const SESSION = require("unisys/common-session");
const PROMPTS = require("system/util/prompts");
const PR = PROMPTS.Pad("NCLOGIC");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DESELECTED_COLOR = "";
// For backwards compatability, if the template is not setting these
// Ideally we want to centralize the backwards compatability at some point into one spot
// OR just remove it, but this was easier to test and shouldn't impact performance substantively
const DEFAULT_SEARCH_COLOR = "#008800";
const DEFAULT_SOURCE_COLOR = "#FFa500";
const TARGET_COLOR = "#FF0000";

const DATASET = window.NC_CONFIG.dataset || "netcreate";
const TEMPLATE_URL = `templates/${DATASET}.toml`;


/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ LOADASSETS fires before react components are loaded
    see client-lifecycle.js for description
/*/
MOD.Hook("LOADASSETS", () => {
  if (UNISYS.IsStandaloneMode()) {
    // STANDALONE MODE
    // Load read-only database from exported db file.

    const USE_CACHE = false;
    if (USE_CACHE) {
      console.warn(PR,"STANDALONE MODE: 'LOADASSETS' using browser cache");
      return new Promise((resolve, reject) => {
        const lstore = window.localStorage;
        let ld3 = lstore.getItem("D3DATA");
        D3DATA = JSON.parse(ld3);
        if (!D3DATA) reject(Error("couldn't get D3DATA from Local Store"));
        UDATA.SetAppState("D3DATA", D3DATA);
        let tem = lstore.getItem("TEMPLATE");
        TEMPLATE = JSON.parse(tem);
        console.log(D3DATA, TEMPLATE);
        if (!TEMPLATE) reject(Error("couldn't get TEMPLATE from Local Store"));
        UDATA.SetAppState("TEMPLATE", TEMPLATE);
        resolve();
      });
    }
    // don't use cache, but instead try loading standalone files
    console.warn(PR,"STANDALONE MODE: 'LOADASSETS' is using files (USE_CACHE=false)");
    // added by Joshua to check for alternative datasets in the folder
    let urlParams = new URLSearchParams(window.location.search);
    let dataset = urlParams.get('dataset');
    if(dataset == null) dataset = "standalone";
    return new Promise((resolve) => {
      (async () => {
        let p1 = await DATASTORE.PromiseJSONFile("data/" + dataset + "-db.json")
          .then(data => {
            m_MigrateData(data);
            m_RecalculateAllEdgeWeights(data);
            UDATA.SetAppState("D3DATA", data);
            // Save off local reference because we don't have D3DATA AppStateChange handler
            D3DATA = data;
          });
        // load template
        let p2 = await DATASTORE.PromiseTOMLFile("data/" + dataset + ".template.toml")
          .then(data => {
            TEMPLATE = data;
            UDATA.SetAppState("TEMPLATE", TEMPLATE);
          });
        resolve();
      })();
    });
  }

  // NOT STANDALONE MODE so load data into D3DATA
  let p1 = DATASTORE.PromiseD3Data()
  .then(data => {
    if (DBG) console.log(PR, "DATASTORE returned data", data);
    m_MigrateData(data.d3data);
    m_RecalculateAllEdgeWeights(data.d3data);
    UDATA.SetAppState("D3DATA", data.d3data);
    UDATA.SetAppState("TEMPLATE", data.template);
    // Save off local reference because we don't have D3DATA AppStateChange handler
    D3DATA = data.d3data;
    TEMPLATE = data.template;
  });
  return Promise.all([p1]);
}); // loadassets

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ CONFIGURE fires after LOADASSETS, so this is a good place to put TEMPLATE
    validation.
/*/
// eslint-disable-next-line complexity
MOD.Hook("CONFIGURE", () => {
  // Process Node, NodeColorMap and Edge options
  m_ValidateTemplate();
  m_UpdateColorMap();
}); // end CONFIGURE HOOK

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DISCONNECT fires when NetMessage.GlobalOfflineMode()
/*/
MOD.Hook("DISCONNECT", () => {
  console.log("DISCONNECT HOOK");
  const lstore = window.localStorage;
  lstore.setItem("D3DATA", JSON.stringify(D3DATA));
  lstore.setItem("TEMPLATE", JSON.stringify(TEMPLATE));
  console.log("saving d3data, template to localstore");
});

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ Handle D3-related updates based on state changes. Subcomponents are
      responsible for updating themselves.
  /*/
  UDATA.OnAppStateChange("SELECTION", stateChange => {
    if (DBG) console.log("nc-logic: Got SELECTION", stateChange);
    let { nodes, edges } = stateChange;
    // NODE LIST UPDATE
    if (nodes !== undefined) {
      if (nodes.length > 0) {
        let color = "#0000DD";
        nodes.forEach(node => {
          m_MarkNodeById(node.id, color);
          UNISYS.Log("select node", node.id, node.label);
          let googlea = NC_CONFIG.googlea;

          if(googlea != "0"){
            ga('send', {
              hitType: 'event',
              eventCategory: 'Node',
              eventAction: '' + node.label,
              eventLabel: '' + window.location
            });
          }
        });
      } else {
        m_UnMarkAllNodes();
      }
    }
  }); // StateChange SELECTION
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ Search field has been updated
  /*/
  UDATA.OnAppStateChange("SEARCH", stateChange => {
    if (DBG) console.log("nc-logic: Got SEARCH", stateChange);
    let { nodes, edges } = stateChange;
    let { searchLabel } = stateChange;
    let { activeAutoCompleteId } = stateChange;
    // NODE LIST UPDATE
    if (nodes !== undefined) {
      if (nodes.length > 0) {
        const color = TEMPLATE.searchColor || DEFAULT_SEARCH_COLOR;
        nodes.forEach(node => m_MarkNodeById(node.id, color));
      } else {
        m_UnMarkAllNodes();
      }
    }
    // SEARCH LABEL UPDATE
    if (D3DATA.nodes.length < 150) { // JD to speedup processing for large sets
      if (searchLabel === "") {
        m_UnStrokeAllNodes();
      } else if (searchLabel !== undefined) {
         m_SetStrokeColorThatMatch(searchLabel, TEMPLATE.searchColor || DEFAULT_SEARCH_COLOR);
      }
    }
  }); // StateChange SELECTION


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ User has clicked on a suggestion from the AutoCopmlete suggestion list.
      The source node should be loaded in NodeSelector.

      OR, user has clicked on a node in the D3 graph.

      SOURCE_SELECT select node by LABEL. There is only one selected node
      in the app at any one time, though nodeLabels is passed as an array.
      SEE ALSO: AutoComplete.onSuggestionSelected() and
                D3SimpleNetGraph._UpdateGraph click handler
  /*/
  UDATA.HandleMessage("SOURCE_SELECT", m_sourceSelect);
  function m_sourceSelect (data) {
    if (DBG) console.log(PR, "SOURCE_SELECT got data", data);

    let { nodeLabels = [], nodeIDs = [] } = data;
    let nodeLabel = nodeLabels.shift();
    let nodeID = nodeIDs.shift();
    let node, newState;

    if (nodeID) {
      node = m_FindNodeById(nodeID); // Node IDs should be integers, not strings
      if (DBG) console.log(PR, "SOURCE_SELECT found by nodeID", nodeID, 'node:', node);
    } else if (nodeLabel) {
      node = m_FindMatchingNodesByLabel(nodeLabel).shift();
      if (DBG) console.log(PR, "SOURCE_SELECT found by nodeLabel", nodeLabel, "node:", node);
    } else {
      // No node selected, so deselect
      if (DBG) console.log(PR, "SOURCE_SELECT found no node", node);
    }

    if (DBG) console.log(PR, "SOURCE_SELECT found", node);

    if (node === undefined) {
      // Node not found, create a new node
      newState = {
        nodes: [],
        edges: []
      };
    } else {
      // Load existing node and edges
      let edges = [];
      if (D3DATA.edges) { // if no edges are defined, skip, otherwise chokes on D3DATA.edges.filter
        if (nodeID) {
          edges = edges.concat(
            D3DATA.edges.filter(
              edge => edge.source.id === nodeID || edge.target.id === nodeID
            )
          );
        } else {
          edges = edges.concat(
            D3DATA.edges.filter(
              edge => edge.source.label === nodeLabel || edge.target.label === nodeLabel
            )
          );
        }
      }
      // create state change object
      newState = {
        nodes: [node],
        edges: edges
      };
    }

    // Set the SELECTION state so that listeners such as NodeSelectors update themselves
    UDATA.SetAppState("SELECTION", newState);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_SEARCH sets the current matching term as entered in an
      AutoComplete field.
  /*/
  UDATA.HandleMessage("SOURCE_SEARCH", function(data) {
    let { searchString } = data;
    let matches = m_FindMatchingNodesByLabel(searchString);
    let newState = {
      suggestedNodes: matches.map(n => {
        return { id: n.id, label: n.label };
      }),
      searchLabel: searchString
    };
    // let SELECTION state listeners handle display updates
    UDATA.SetAppState("SEARCH", newState);
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_SEARCH_AND_SELECT first searches for an exact matching node
      and if found, selects it.
      This is called by AutoComplete onBlur in case we need to make an
      implicit selection.
  /*/
  UDATA.HandleMessage("SOURCE_SEARCH_AND_SELECT", function (data) {
    let { searchString } = data;
    let node = m_FindMatchingNodesByLabel(searchString).shift();
    if (node && (node.label === searchString)) {
      console.log(PR,'SOURCE_SEARCH_AND_SELECT about to trigger SOURCE_SELECT data was',data);
      m_sourceSelect({ nodeIDs: [node.id] });
    }
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_HILITE updates the currently rolled-over node name in a list of
      node name selections when using AutoComplete.
      The hilite can be selected via either the label or the node id.
  /*/
 /* ORIGINAL INQUIRIUM CODE
  UDATA.HandleMessage("SOURCE_HILITE", function(data) {
    let { nodeLabel, nodeID, color } = data;
    if (nodeLabel) {
      // Only mark nodes if something is selected
      m_UnMarkAllNodes();
      m_MarkNodeByLabel(nodeLabel, SOURCE_COLOR);
    }
    if (nodeID) {
      // Only mark nodes if something is selected
      m_UnMarkAllNodes();
      m_MarkNodeById(nodeID, SOURCE_COLOR);
    }
    */

    UDATA.HandleMessage("SOURCE_HILITE", function(data) {
    let { nodeLabel, nodeID, color } = data;
    if (nodeLabel) {
      // Only mark nodes if something is selected
      if (D3DATA.nodes.length < 250) { // JD to speedup processing for large
        m_UnMarkAllNodes();
        m_MarkNodeByLabel(nodeLabel, TEMPLATE.sourceColor || DEFAULT_SOURCE_COLOR);
      }
    }
    if (nodeID) {
      // Only mark nodes if something is selected
      if (D3DATA.nodes.length < 250) { // JD to speedup processing for large
        m_UnMarkAllNodes();
        m_MarkNodeById(nodeID, TEMPLATE.sourceColor || DEFAULT_SOURCE_COLOR);
      }
    }

    // NOTE: State is updated in the "MarkNodeBy*" functions above.
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_UPDATE is called when the properties of a node has changed
      Globally updates DATASTORE and working D3DATA objects with the new node data.
      NOTE: SOURCE_UPDATE can be invoked remotely by the server on a DATABASE
      update.
  /*/
  UDATA.HandleMessage("SOURCE_UPDATE", function(data) {
    let { node } = data;
    // try updating existing nodes with this id?
    let updatedNodes = m_SetMatchingNodesByProp({ id: node.id }, node);
    if (DBG) console.log("SOURCE_UPDATE: updated", updatedNodes);
    // if no nodes had matched, then add a new node!
    if (updatedNodes.length > 1) {
      console.error("SOURCE_UPDATE: duplicate ids in", updatedNodes);
      throw Error("SOURCE_UPDATE: found duplicate IDs");
    }
    if (updatedNodes.length === 0) D3DATA.nodes.push(node);
    UDATA.SetAppState("D3DATA", D3DATA);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ NODE_DELETE is called by NodeSelector via datastore.js and
      Server.js when an node should be removed
  /*/
  UDATA.HandleMessage("NODE_DELETE", function(data) {
    let { nodeID, replacementNodeID } = data;

    // Remove or replace edges
    let edgesToProcess;
    if (replacementNodeID !== -1) {
      // replace
      let replacementNode = m_FindNodeById(replacementNodeID);
      edgesToProcess = D3DATA.edges.map(edge => {
        if (edge.source.id === nodeID) edge.source = replacementNode;
        if (edge.target.id === nodeID) edge.target = replacementNode;
        return edge;
      });
    } else {
      // delete nodes
      edgesToProcess = D3DATA.edges.filter(edge => {
        let pass = false;
        if (edge.source.id !== nodeID && edge.target.id !== nodeID) {
          pass = true;
        }
        return pass;
      });
    }
    D3DATA.edges = edgesToProcess;

    // // Remove node
    let updatedNodes = m_DeleteMatchingNodesByProp({ id: nodeID });
    D3DATA.nodes = updatedNodes;
    UDATA.SetAppState("D3DATA", D3DATA);

    // Also update selection so nodes in EdgeEditor will update
    UDATA.SetAppState("SELECTION", {
      nodes: undefined,
      edges: undefined
    });
    // FIXME: need to also update AutoUpdate!!!
    // FIXME: Need to also trigger resize!
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ NODE_TYPES_UPDATE is called by template-logic after user has changed the
      node type options.  This maps changed options to a new name,
      and deleted type options to existing options.
      This updates:
      * The template file with new new node types
      * D3DATA and the databse file with node type changes

      @param {object} data
      @param {object} data.nodeTypesChanges - { label, color, replacement, delete }
      @param {string} data.nodeTypesChanges.label - orig label, used for matching to current node setting
      @param {string} data.nodeTypesChanges.color
      @param {string} data.nodeTypesChanges.replacement - text to replace label
      @param {boolean} data.nodeTypesChanges.delete - option should be removed after mapping
  /*/
  UDATA.HandleMessage("NODE_TYPES_UPDATE", data => {
    const { nodeTypesChanges } = data;
    const changeMap = new Map();
    nodeTypesChanges.forEach(c => {
      changeMap.set(c.label, c);
    });
    D3DATA.nodes = D3DATA.nodes.map(n => {
      const type = n.type;
      const change = changeMap.get(n.type);
      if (change && change.replacement) {
        n.type = change.replacement;
      }
      return n;
    });
    // Convert D3 source/target nodes objects into ids
    D3DATA.edges = m_ConvertSourceTarget2ID(D3DATA.edges);
    // Write to database!
    // IMPORTANT: We have to update the db BEFORE calling SetAppState
    // because SetAppState will cause d3 to convert edge source/targets
    // from ids back to node objects.
    UDATA.LocalCall("DBUPDATE_ALL", D3DATA);
    UDATA.SetAppState("D3DATA", D3DATA);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_TYPES_UPDATE is called by template-logic after user has changed the
      edge type options.  This maps changed options to a new name,
      and deleted type options to existing options.
      This updates:
      * The template file with new new edge types
      * D3DATA and the databse file with edge type changes

      @param {object} data
      @param {object} data.nodeTypesChanges - { label, color, replacement, delete }
      @param {string} data.nodeTypesChanges.label - orig label, used for matching to current edge setting
      @param {string} data.nodeTypesChanges.color
      @param {string} data.nodeTypesChanges.replacement - text to replace label
      @param {boolean} data.nodeTypesChanges.delete - option should be removed after mapping
  /*/
  UDATA.HandleMessage("EDGE_TYPES_UPDATE", data => {
    const { edgeTypesChanges } = data;
    const changeMap = new Map();
    edgeTypesChanges.forEach(c => {
      changeMap.set(c.label, c);
    });
    D3DATA.edges = D3DATA.edges.map(e => {
      const type = e.type;
      const change = changeMap.get(e.type);
      if (change && change.replacement) {
        console.log('replacing',e.type,'with',change.replacement)
        e.type = change.replacement;
      }
      return e;
    });
    // Write to database!
    // IMPORTANT: We have to update the db BEFORE calling SetAppState
    // because SetAppState will cause d3 to convert edge source/targets
    // from ids back to node objects.
    UDATA.LocalCall("DBUPDATE_ALL", D3DATA);
    UDATA.SetAppState("D3DATA", D3DATA);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_UPDATE is called when the properties of an edge has changed
      NOTE: SOURCE_UPDATE can be invoked remotely by the server on a DATABASE
      update.
  /*/
  UDATA.HandleMessage("EDGE_UPDATE", function(data) {
    let { edge } = data;
    if (DBG) console.log("nc-logic.EDGE_UPDATE: received edge", edge);
    // edge.source and edge.target are initially ids
    // replace then with node data
    edge.source = m_FindNodeById(edge.source);
    edge.target = m_FindNodeById(edge.target);
    // set matching nodes
    let updatedEdges = m_SetMatchingEdgesByProp({ id: edge.id }, edge);
    if (DBG) console.log("nc-logic.EDGE_UPDATE: updated", updatedEdges);

    // if no nodes had matched, then add a new node!
    if (updatedEdges.length === 0) {
      if (DBG) console.log("nc-logic.EDGE_UPDATE: adding new edge", edge);
      // created edges should have a default size
      edge.size = 1;
      D3DATA.edges.push(edge);
    }
    // if there was one node
    if (updatedEdges.length === 1) {
      console.log('nc-logic.EDGE_UPDATE: updating existing edge', updatedEdges)
    }
    // Edge source and target links should be stored as
    // ids rather than references to the actual source and
    // target node objects.
    //
    // d3 will map the source and target ids to the
    // node objects themsleves during the _UpdateGraph method.
    //
    // So we explicitly set and store ids rather than objects here.
    //
    // (If we don't do this, the edges become disconnected from nodes)
    edge.source = edge.source.id;
    edge.target = edge.target.id;
    // Calculate Edge Size
    edge.size = m_CalculateEdgeWeight(edge, D3DATA.edges);

    // if there were more edges than expected
    if (updatedEdges.length > 1) {
      throw Error("EdgeUpdate found duplicate IDs");
    }

    UDATA.SetAppState("D3DATA", D3DATA);
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_DELETE is called when an edge should be removed from...something?
  /*/
  UDATA.HandleMessage("EDGE_DELETE", function(data) {
    let { edgeID } = data;
    let edges = [];
    // remove specified edge from edge list
    D3DATA.edges = m_DeleteMatchingEdgeByProp({ id: edgeID });
    UDATA.SetAppState("D3DATA", D3DATA);
    // Also update selection so edges in EdgeEditor will update
    let selection = UDATA.AppState("SELECTION");
    if (
      selection.nodes === undefined ||
      selection.nodes.length < 1 ||
      selection.nodes[0].id === undefined
    ) {
      if (DBG) console.log(PR, "no selection:", selection);
    } else {
      if (DBG) console.log(PR, "updating selection:", selection);
      let nodeID = selection.nodes[0].id;
      // Remove the deleted edge from the selection
      if (selection.edges !== undefined && selection.edges.length > 0) {
        edges = edges.concat(
          selection.edges.filter(edge => edge.id !== edgeID)
        );
      }
    }
    UDATA.SetAppState("SELECTION", {
      nodes: selection.nodes,
      edges: edges
    });
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ AUTOCOMPLETE_SELECT is called by <AutoComplete> components to tell the
      module which one has the current focus.
  /*/
  UDATA.HandleMessage("AUTOCOMPLETE_SELECT", function(data) {
    m_HandleAutoCompleteSelect(data);
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ TEMPLATE has been edited
      This message is sent from server.js over the net.
      This is the main handler for the local app.  It updates the appState.
  /*/
  UDATA.HandleMessage("NET_TEMPLATE_UPDATE", stateChange => {
    if (DBG) console.log(PR, 'NET_TEMPLATE_UPDATE state change', stateChange)
    TEMPLATE = stateChange;
    UDATA.SetAppState("TEMPLATE", TEMPLATE);
    m_UpdateColorMap();
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/
  /*/
  UDATA.HandleMessage("EXPORT_NODES", data => {
    EXPORT.ExportNodes();
  });
  UDATA.HandleMessage("EXPORT_EDGES", data => {
    EXPORT.ExportEdges();
  });

  UDATA.HandleMessage("IMPORT", EXPORT.Import);
  UDATA.HandleMessage("VALIDATE_NODEFILE", EXPORT.ValidateNodeFile);
  UDATA.HandleMessage("VALIDATE_EDGEFILE", EXPORT.ValidateEdgeFile);
  UDATA.HandleMessage("VALIDATE_TOMLFILE", EXPORT.ValidateTOMLFile);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  UDATA.HandleMessage("EDIT_CURRENT_TEMPLATE", () => {
    return { template: TEMPLATE }
  })

}); // end UNISYS_INIT


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ INIT HANDLERS
/*/

function m_HandleAutoCompleteSelect(data) {
  if (DBG) console.log("ACL: Setting activeAutoCompleteId to", data.id);
  UDATA.SetAppState("ACTIVEAUTOCOMPLETE", {
    activeAutoCompleteId: data.id
  });
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle RESET handler
/*/
MOD.Hook("RESET", () => {
  // Force an AppState update here so that the react components will load
  // the data after they've been initialized.  The SetAppState call in
  // LOADASSETS is broadcast before react components have been loaded.
  UDATA.SetAppState("D3DATA", D3DATA);
}); // end UNISYS_RESET

/// APP_READY MESSAGE REGISTRATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/
MOD.Hook("APP_READY", function(info) {
  /// RETURN PROMISE to prevent phase from continuing until after registration
  /// of messages is successful
  return new Promise((resolve, reject) => {
    if (DBG)
      console.log(`${PR}HOOK 'UNISYS_INIT' Registering Message Handlers...`);
    // timeout for broken network registration
    let timeout = setTimeout(() => {
      reject(new Error("UNISYS REGISTER TIMEOUT"));
    }, 5000);

    // register ONLY messages we want to make public
    UNISYS.RegisterMessagesPromise([
      "SOURCE_UPDATE",
      `NODE_DELETE`,
      "EDGE_UPDATE",
      "EDGE_DELETE",
      "EDIT_PERMITTED",
      "NET_TEMPLATE_UPDATE"
    ]).then(d => {
      clearTimeout(timeout);
      if (DBG)
        console.log(
          `${PR}HOOK 'UNISYS_INIT' Registered Message Handlers ${JSON.stringify(
            d.registered
          )}`
        );
      if (DBG)
        console.log(
          `INFO: %cMy socket address is ${UNISYS.SocketUADDR()}`,
          "color:blue;font-weight:bold"
        );
      resolve();
    });
  });
}); // end UNISYS_READY

/// OBJECT HELPERS ////////////////////////////////////////////////////////////
/// these probably should go into a utility class
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of objects that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/
function m_FindMatchingObjsByProp(obj_list, match_me = {}) {
  // operate on arrays only
  if (!Array.isArray(obj_list))
    throw Error("FindMatchingObjectsByProp arg1 must be array");
  let matches = obj_list.filter(obj => {
    let pass = true;
    for (let key in match_me) {
      if (match_me[key] !== obj[key]) pass = false;
      break;
    }
    return pass;
  });
  // return array of matches (can be empty array)
  return matches;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Set array of objects that match to key/values of yes/no respectively
    Returns array of matched objects
/*/
function m_SetMatchingObjsByProp(obj_list, match_me = {}, yes = {}, no = {}) {
  // operate on arrays only
  if (!Array.isArray(obj_list))
    throw Error("SetMatchingObjsByPropp arg1 must be array");

  let returnMatches = [];
  obj_list.forEach(node => {
    let matched = true;
    for (let key in match_me) {
      if (match_me[key] !== node[key]) matched = false;
      break;
    }
    if (matched) {
      for (let key in yes) node[key] = yes[key];
      returnMatches.push(node);
    } else {
      for (let key in no) node[key] = no[key];
    }
  });
  return returnMatches;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of everything in obj_list
/*/
function m_SetAllObjs(obj_list, all = {}) {
  // operate on arrays only
  if (!Array.isArray(obj_list)) throw Error("SetAllNodes arg1 must be array");
  obj_list.forEach(obj => {
    for (let key in all) obj[key] = all[key];
  });
}
MOD.SetAllObjs = m_SetAllObjs; // Expose for filter-logic.js

/// NODE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Validate Template File
/*/
function m_ValidateTemplate() {
  try {
    // nodeDefs
    let nodeDefs = TEMPLATE.nodeDefs;
    if (nodeDefs === undefined) {
      throw "Missing `nodeDefs` nodeDefs=" + nodeDefs;
    }
    if (nodeDefs.label === undefined) throw "Missing `nodeDefs.label` label=" + nodeDefs.label;
    if (nodeDefs.type === undefined) throw "Missing `nodeDefs.type` type= " + nodeDefs.type;
    if (
      nodeDefs.type.options === undefined ||
      !Array.isArray(nodeDefs.type.options)
    ) {
      throw "Missing or bad `nodeDefs.type.options` options=" +
        nodeDefs.type.options;
    }
    if (nodeDefs.notes === undefined) throw "Missing `nodeDefs.notes` notes=" + nodeDefs.notes;
    if (nodeDefs.info === undefined) throw "Missing `nodeDefs.info` info=" + nodeDefs.info;

    // edgeDefs
    let edgeDefs = TEMPLATE.edgeDefs;
    if (edgeDefs === undefined) throw "Missing `edgeDefs` edgeDefs=" + edgeDefs;
    if (edgeDefs.source === undefined) throw "Missing `edgeDefs.source` source=" + edgeDefs.source;
    if (edgeDefs.type === undefined) throw "Missing `edgeDefs.type` type= " + edgeDefs.type;
    if (
      edgeDefs.type.options === undefined ||
      !Array.isArray(edgeDefs.type.options)
    ) {
      throw "Missing or bad `edgeDefs.type.options` options=" +
        edgeDefs.type.options;
    }
    if (edgeDefs.target === undefined) throw "Missing `edgeDefs.target` label=" + edgeDefs.target;
    if (edgeDefs.notes === undefined) throw "Missing `edgeDefs.notes` notes=" + edgeDefs.notes;
    if (edgeDefs.info === undefined) throw "Missing `edgeDefs.info` info=" + edgeDefs.info;
    if (edgeDefs.citation === undefined) throw "Missing `edgeDefs.citation` info=" + edgeDefs.citation;
    if (edgeDefs.category === undefined) throw "Missing `edgeDefs.category` info=" + edgeDefs.category;
  } catch (error) {
    console.error(
      PR + "Error loading template `",
      TEMPLATE_URL,
      "`::::",
      error
    );
  }
}

/*/ Update ColorMap
/*/
function m_UpdateColorMap() {
  // REVIEW: Load ColorMap in d3?  or elsewhere?  does it need its own state?
  // Joshua added Edges in here ... it should either be renamed or kept separate
  // but this was a proof of concept. Probably they should be kept separate in case
  // someone ever chooses to use the same label twice, but ...
  try {
    const nodeColorMap = {};
    TEMPLATE.nodeDefs.type.options.forEach(o => {
      nodeColorMap[o.label] = o.color;
    });

    const edgeColorMap = {};
    let defaultEdgeColor = TEMPLATE.edgeDefs.color || "#999"; //for backwards compatability
    TEMPLATE.edgeDefs.type.options.forEach(o => {
      edgeColorMap[o.label] = o.color || defaultEdgeColor;
    });

    UDATA.SetAppState("COLORMAP", {nodeColorMap, edgeColorMap});
  } catch (error) {
    console.error(
      PR,
      "received bad TEMPLATE node options.  ERROR:",
      error,
      ". DATA:",
      TEMPLATE
    );
  }
}

/*/ Return array of nodes that DON'T match del_me object keys/values
/*/
function m_DeleteMatchingNodesByProp(del_me = {}) {
  let matches = D3DATA.nodes.filter(node => {
    let pass = false;
    for (let key in del_me) {
      if (del_me[key] !== node[key]) {
        pass = true;
        break;
      }
    }
    return pass;
  });
  // return array of matches (can be empty array)
  return matches;
}
/*/ Return array of nodes that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/
function m_FindMatchingNodeByProp(match_me = {}) {
  return m_FindMatchingObjsByProp(D3DATA.nodes, match_me);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Convenience function to retrieve node by ID
/*/ function m_FindNodeById(id) {
  return m_FindMatchingNodeByProp({ id })[0];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of nodes with labels that partially match str
/*/
function m_FindMatchingNodesByLabel(str = "") {
  if (!str) return [];
  str = u_EscapeRegexChars(str.trim());
  if (str === "") return [];
  const regex = new RegExp(/*'^'+*/ str, "i");
  return D3DATA.nodes.filter(node => regex.test(node.label));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Set nodes that PARTIALLY match 'str' to 'yes' props.
    All others nodes are set to 'no' props. Return matches
    Optionally resets all the NON matching nodes as well
/*/
function m_SetMatchingNodesByLabel(str = "", yes = {}, no = {}) {
  let returnMatches = [];
  str = u_EscapeRegexChars(str.trim());
  if (str === "") return undefined;
  const regex = new RegExp(/*'^'+*/ str, "i");
  D3DATA.nodes.forEach(node => {
    if (regex.test(node.label)) {
      for (let key in yes) node[key] = yes[key];
      returnMatches.push(node);
    } else {
      for (let key in no) node[key] = no[key];
    }
  });
  return returnMatches;
}



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of exact matching nodes, returns matches
    Optionally resets all the NON matching nodes as well
/*/
function m_SetMatchingNodesByProp(match_me = {}, yes = {}, no = {}) {
  return m_SetMatchingObjsByProp(D3DATA.nodes, match_me, yes, no);
}

/// EDGE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of edges that DON'T match del_me object keys/values
/*/
function m_DeleteMatchingEdgeByProp(del_me = {}) {
  let matches = D3DATA.edges.filter(edge => {
    let pass = false;
    for (let key in del_me) {
      if (del_me[key] !== edge[key]) {
        pass = true;
        break;
      }
    }
    return pass;
  });
  // return array of matches (can be empty array)
  return matches;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of exact matching edges, returns matches
/*/
function m_SetMatchingEdgesByProp(match_me = {}, yes = {}, no = {}) {
  return m_SetMatchingObjsByProp(D3DATA.edges, match_me, yes, no);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Count number of edges with the same source/target to determine weight
      `data` is passed by reference
      This modifies `data`
      data = { nodes: [], edges: [] }
/*/
function m_RecalculateAllEdgeWeights(data) {
  data.edges.forEach(edge => {
    edge.size = m_CalculateEdgeWeight(edge, data.edges);
  });
  return data;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Count number of edges with the same source/target to determine weight
/*/
function m_CalculateEdgeWeight(edge, edges) {
  // REVIEW: If there's a match, BOTH edge sizes ought to be set!

  let size = edges.reduce((accumulator, e) => {
    // Ignore self
    if (e.id === edge.id) return accumulator;
    // source and target might be ids or might be node objects depending
    // on whether D3 has processed the edge object.
    let sourceId = e.source.id || e.source;
    let targetId = e.target.id || e.target;
    let edgeSourceId = edge.source.id || edge.source;
    let edgeTargetId = edge.target.id || edge.target;
    //console.log('comparing sourceId',sourceId,'to',edgeSourceId,' / targetId',targetId,'to',edgeTargetId);
    if (
      (sourceId === edgeSourceId && targetId === edgeTargetId) ||
      (sourceId === edgeTargetId && targetId === edgeSourceId)
    )
      return accumulator + 1;
    return accumulator;
  }, 1);
  return size;
}

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ REGEX: the chars in brackets are part of matching character set.
    Declaring this as a constant makes the RegEx run faster (I think).
/*/
const REGEX_REGEXCHARS = /[.*+?^${}()|[\]\\]/g;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Adds a \ in front of characters that have special RegEx meaning
    From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expression
/*/
function u_EscapeRegexChars(string) {
  return string.replace(REGEX_REGEXCHARS, "\\$&"); // $& means the whole matched string
}
MOD.EscapeRegexChars = u_EscapeRegexChars; // Expose for filter-logic.js
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Migrate Data from older formats

    1. Convert all IDs to integers
        Node and Edge IDs should be integers.
        This isn't a problem with newly created datasets as the network-generated IDs
        are integers.  However, with older data sets, the IDs may have been strings.
        e.g. exports from Gephi will have string IDs.
        This mismatch is a problem when looking up nodes by ID.
          `data` is passed by reference
          This modifies `data`
          data = { nodes: [], edges: [] }
    2. Convert 'attributes' from pre v1.4 datasets
        NODES
          attributes.Node_type => type
          attributes[Extra Info] => info
          attributes.Notes => notes
        EDGES
          attributes.Relationship => type
          attributes.Info => info
          attributes.Citations = citation
          attributes.Notes => notes
    3. Remove the old `attributes` key
/*/
function m_MigrateData(data) {
  data.nodes.forEach(node => {
    node.id = parseInt(node.id);
    if (node.attributes) { // don't clobber if value is already set
      node.type = node.type || node.attributes.Node_Type;
      node.info = node.info || node.attributes["Extra Info"];
      node.notes = node.notes || node.attributes.Notes;
      // clear it
      Reflect.deleteProperty(node, 'attributes');
    }
  });
  data.edges.forEach(edge => {
    edge.id = parseInt(edge.id);
    // before D3 processing, edge.source and edge.target are ids
    edge.source = parseInt(edge.source);
    edge.target = parseInt(edge.target);
    if (edge.attributes) { // don't clobber if value is already set
      edge.type = edge.type || edge.attributes.Relationship;
      edge.info = edge.info || edge.attributes.Info;
      edge.citation = edge.citation || edge.attributes.Citations;
      edge.notes = edge.notes || edge.attributes.Notes;
      edge.category = edge.category || edge.attributes.Category;
      // clear it
      Reflect.deleteProperty(edge, 'attributes');
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Converts edge.source and edge.target from objects to ids
    d3 converts edge.source and edget.target from ids to node objects
    when it renders D3DATA.  When getting ready to save edges to the database
    we need to convert them back to ids.
/*/
function m_ConvertSourceTarget2ID(edges) {
  return edges.map(e => {
    e.source = e.source && e.source.id;
    e.target = e.target && e.target.id;
    return e;
  });
}

/// NODE MARKING METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Visually change all nodes to the deselected color
/*/
function m_UnMarkAllNodes() {
  let props = { selected: DESELECTED_COLOR };
  m_SetAllObjs(D3DATA.nodes, props);
  UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Remove the stroke color.  Used to unmark search matches.
/*/
function m_UnStrokeAllNodes() {
  let props = { strokeColor: undefined };
  m_SetAllObjs(D3DATA.nodes, props);
  UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the `node.selected` property to `color` so it is hilited on graph
/*/
function m_MarkNodeById(id, color) {
  let marked = { selected: TEMPLATE.sourceColor != undefined? TEMPLATE.sourceColor : DEFAULT_SOURCE_COLOR };
  let normal = { selected: DESELECTED_COLOR };
  // NOTE: this.getSelectedNodeColor(node,color) and
  // this.getDeselectedNodeColor(node,color) are not yet implemented
  // to override the properties
  m_SetMatchingNodesByProp({ id }, marked, normal);

    UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the `node.selected` property to `color` so it is hilited on graph
/*/
function m_MarkNodeByLabel(label, color) {
  let marked = { selected: color };
  let normal = { selected: DESELECTED_COLOR };
  // NOTE: this.getSelectedNodeColor(node,color) and
  // this.getDeselectedNodeColor(node,color) are not yet implemented
  // to override the properties
  m_SetMatchingNodesByLabel(label, marked, normal);

  UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets matching node labels to the passed selection color
/*/
function m_MarkNodesThatMatch(searchString, color) {
  if (searchString === "") {
    m_UnMarkAllNodes();
    return;
  }
  let select = { selected: color };
  let deselect = { selected: DESELECTED_COLOR };
  m_SetMatchingNodesByLabel(searchString, select, deselect);
  UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets matching node labels to the passed selection color
    This sets the stroke color, which is used to display
    the matching nodes during a search.  If the node is
    also selected, the selected color will override this color.
/*/
function m_SetStrokeColorThatMatch(searchString, color) {
  let matched = { strokeColor: color };
  let notmatched = { strokeColor: undefined };
  m_SetMatchingNodesByLabel(searchString, matched, notmatched);
  UDATA.SetAppState("D3DATA", D3DATA);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the 'selected' state of edges that are attached to the node
/*/
function m_MarkSelectedEdges(edges, node) {
  // Delesect all edges first
  edges.forEach(edge => {
    edge.selected = false;
  });
  // Find connected edges
  let id = node.id;
  D3DATA.edges.forEach(edge => {
    if (edge.source.id === id || edge.target.id === id) {
      edge.selected = true;
    } else {
      edge.selected = false;
    }
  });
  UDATA.SetAppState("D3DATA", D3DATA);
}

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/
JSCLI.AddFunction(function ncPushDatabase(jsonFile) {
  jsonFile = jsonFile || "data.reducedlinks.json";
  DATASTORE.PromiseJSONFile(jsonFile)
    .then(data => {
      // data is { nodes, edges }
      console.log(PR, `Sending data from ${jsonFile} to Server`, data);
      // UDATA.Call() returns a promise, so return it to
      // continue the asynchronous chain
      return UDATA.Call("SRV_DBSET", data);
    })
    .then(d => {
      if (d.OK) {
        window.alert(
          `assets/data/${jsonFile} was pushed to Server.\nPress OK to refresh this page and MANUALLY REFRESH other clients.\n\n(note: if data hasn't changed, try command again)`
        );
        console.log(
          `${PR} %cServer Database has been overwritten with ${jsonFile}`,
          "color:blue"
        );
        console.log(`${PR} Reload apps to see new data`);
        setTimeout(UNISYS.ForceReloadOnNavigation, 1000);
      } else {
        console.error(PR, "Server Error", d);
        window.alert(`Error ${JSON.stringify(d)}`);
      }
    });
  // return syntax help
  return "FYI: ncPushDatabase(jsonFile) can load file in assets/data";
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: EMPTY THE DATABASE from default data
/*/ JSCLI.AddFunction(
  function ncEmptyDatabase() {
    window.ncPushDatabase("nada.json");
    return "FYI: pushing empty database from assets/data/nada.json...reloading";
  }
);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: Unlock the database.  Used to recover from error conditions where
    a node or edge is inadvertently left locked.
/*/
JSCLI.AddFunction(
  function ncUnlockAll() {
    UDATA.NetCall('SRV_DBUNLOCKALL', {});
    return "Unlocking all nodes and edges in the database, and enabling template edits.";
  }
);
JSCLI.AddFunction(
  function ncUnlockAllNodes() {
    UDATA.NetCall('SRV_DBUNLOCKALLNODES', {});
    return "Unlocking all nodes in the database.";
  }
);
JSCLI.AddFunction(
  function ncUnlockAllEdges() {
    UDATA.NetCall('SRV_DBUNLOCKALLEDGES', {});
    return "Unlocking all edges in the database.";
  }
);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: Token Generator
/*/
JSCLI.AddFunction(function ncMakeTokens(clsId, projId, dataset, numGroups) {
  // type checking
  if (typeof clsId !== "string")
    return "args: str classId, str projId, str dataset, int numGroups";
  if (typeof projId !== "string")
    return "args: str classId, str projId, str dataset, int numGroups";
  if (typeof dataset !== "string")
    return "args: str classId, str projId, str dataset, int numGroups";
  if (clsId.length > 12) return "classId arg1 should be 12 chars or less";
  if (projId.length > 12) return "classId arg1 should be 12 chars or less";
  if (!Number.isInteger(numGroups)) return "numGroups arg3 must be integer";
  if (numGroups < 1) return "numGroups arg3 must be positive integer";
  // let's do this!
  let out = `\nTOKEN LIST for class '${clsId}' project '${projId}'\n\n`;
  let pad = String(numGroups).length;
  for (let i = 1; i <= numGroups; i++) {
    let id = String(i);
    id = id.padStart(pad, "0");
    out += `group ${id}\t${SESSION.MakeToken(clsId, projId, i, dataset)}\n`;
  }
  if (window && window.location) {
    let ubits = new URL(window.location);
    let hash = ubits.hash.split("/")[0];
    let url = `${ubits.protocol}//${ubits.host}/${hash}`;
    out += `\nexample url: ${SETTINGS.ServerAppURL()}/edit/${SESSION.MakeToken(
      clsId,
      projId,
      1
    )}\n`;
  }
  return out;
});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
