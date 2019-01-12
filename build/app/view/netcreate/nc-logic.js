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
const SEARCH_COLOR = "#008800";
const SOURCE_COLOR = "#0000DD";
const TARGET_COLOR = "#FF0000";

const TEMPLATE_URL = "../templates/alexander.json";

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ LOADASSETS fires before react components are loaded
    see client-lifecycle.js for description
/*/
MOD.Hook("LOADASSETS", () => {
  if (UNISYS.IsOfflineMode()) {

    const USE_CACHE = false;
    if (USE_CACHE) {
      console.warn(PR,"OFFLINE MODE: 'LOADASSETS' using browser cache");
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
    console.warn(PR,"OFFLINE MODE: 'LOADASSETS' is using files (USE_CACHE=false)");
    let p1 = DATASTORE.PromiseJSONFile("../data/standalone-db.json")
    .then(data => {
      console.log(data);
      m_ConvertData(data);
      m_RecalculateAllEdgeWeights(data);
      UDATA.SetAppState("D3DATA", data);
      // Save off local reference because we don't have D3DATA AppStateChange handler
      D3DATA = data;
    });
    // load template
    let p2 = DATASTORE.PromiseJSONFile(TEMPLATE_URL)
    .then(data => {
      TEMPLATE = data;
      UDATA.SetAppState("TEMPLATE", TEMPLATE);
    });
    return Promise.all([p1,p2]);
  }
  // if got this far...
  // NOT OFFLINE MODE so load data into D3DATA
  let p1 = DATASTORE.PromiseD3Data()
  .then(data => {
    if (DBG) console.log(PR, "DATASTORE returned data", data);
    m_ConvertData(data);
    m_RecalculateAllEdgeWeights(data);
    UDATA.SetAppState("D3DATA", data);
    // Save off local reference because we don't have D3DATA AppStateChange handler
    D3DATA = data;
  });
  // load Template data and return it as a promise
  // so that react render is called only after the template is loaded
  let p2 = DATASTORE.PromiseJSONFile(TEMPLATE_URL)
  .then(data => {
    if (DBG) console.log(PR, "DATASTORE returned json", data);
    TEMPLATE = data;
    UDATA.SetAppState("TEMPLATE", TEMPLATE);
  });
  return Promise.all([p1, p2]);
}); // loadassets

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ CONFIGURE fires after LOADASSETS, so this is a good place to put TEMPLATE
    validation.
/*/
MOD.Hook("CONFIGURE", () => {
  // Process Node, NodeColorMap and Edge options

  // Validate the template file
  try {
    // nodePrompts
    let nodePrompts = TEMPLATE.nodePrompts;
    if (nodePrompts === undefined) {
      throw "Missing `nodePrompts` nodePrompts=" + nodePrompts;
    }
    if (nodePrompts.label === undefined)
      throw "Missing `nodePrompts.label` label=" + nodePrompts.label;
    if (nodePrompts.type === undefined)
      throw "Missing `nodePrompts.type` type= " + nodePrompts.type;
    if (
      nodePrompts.type.options === undefined ||
      !Array.isArray(nodePrompts.type.options)
    ) {
      throw "Missing or bad `nodePrompts.type.options` options=" +
        nodePrompts.type.options;
    }
    if (nodePrompts.notes === undefined)
      throw "Missing `nodePrompts.notes` notes=" + nodePrompts.notes;
    if (nodePrompts.info === undefined)
      throw "Missing `nodePrompts.info` info=" + nodePrompts.info;

    // edgePrompts
    let edgePrompts = TEMPLATE.edgePrompts;
    if (edgePrompts === undefined)
      throw "Missing `edgePrompts` edgePrompts=" + edgePrompts;
    if (edgePrompts.source === undefined)
      throw "Missing `edgePrompts.source` source=" + edgePrompts.source;
    if (edgePrompts.type === undefined)
      throw "Missing `edgePrompts.type` type= " + edgePrompts.type;
    if (
      edgePrompts.type.options === undefined ||
      !Array.isArray(edgePrompts.type.options)
    ) {
      throw "Missing or bad `edgePrompts.type.options` options=" +
        edgePrompts.type.options;
    }
    if (edgePrompts.target === undefined)
      throw "Missing `edgePrompts.target` label=" + edgePrompts.target;
    if (edgePrompts.notes === undefined)
      throw "Missing `edgePrompts.notes` notes=" + edgePrompts.notes;
    if (edgePrompts.info === undefined)
      throw "Missing `edgePrompts.info` info=" + edgePrompts.info;
    if (edgePrompts.citation === undefined)
      throw "Missing `edgePrompts.citation` info=" + edgePrompts.citation;
  } catch (error) {
    console.error(
      PR + "Error loading template `",
      TEMPLATE_URL,
      "`::::",
      error
    );
  }

  // REVIEW: Load ColorMap in d3?  or elsewhere?  does it need its own state?
  try {
    let nodeColorMap = {};
    TEMPLATE.nodePrompts.type.options.forEach(o => {
      nodeColorMap[o.label] = o.color;
    });
    UDATA.SetAppState("NODECOLORMAP", nodeColorMap);
  } catch (error) {
    console.error(
      PR,
      "received bad TEMPLATE node options.  ERROR:",
      error,
      ". DATA:",
      TEMPLATE
    );
  }
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
        let color = SEARCH_COLOR;
        nodes.forEach(node => m_MarkNodeById(node.id, color));
      } else {
        m_UnMarkAllNodes();
      }
    }
    // SEARCH LABEL UPDATE
    if (searchLabel === "") {
      m_UnStrokeAllNodes();
    } else if (searchLabel !== undefined) {
      m_SetStrokeColorThatMatch(searchLabel, SEARCH_COLOR);
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
  UDATA.HandleMessage("SOURCE_SELECT", function(data) {
    if (DBG) console.log(PR, "SOURCE_SELECT got data", data);

    let { nodeLabels = [], nodeIDs = [] } = data;
    let nodeLabel = nodeLabels.shift();
    let nodeID = nodeIDs.shift();
    let node, newState;

    if (nodeID) {
      node = m_FindNodeById(nodeID); // Node IDs should be integers, not strings
    } else if (nodeLabel) {
      node = m_FindMatchingNodesByLabel(nodeLabel).shift();
    } else {
      // No node selected, so deselect
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
      // create state change object
      newState = {
        nodes: [node],
        edges: edges
      };
    }

    // Set the SELECTION state so that listeners such as NodeSelectors update themselves
    UDATA.SetAppState("SELECTION", newState);
  });

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
  /*/ SOURCE_HILITE updates the currently rolled-over node name in a list of
      selections.  The hilite can be selected via either the label or
      the node id.
  /*/
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

    // NOTE: State is updated in the "MaryNodeBy*" functions above.
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
    if (replacementNodeID !== "") {
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
  /*/ EDGE_UPDATE is called when the properties of an edge has changed
      NOTE: SOURCE_UPDATE can be invoked remotely by the server on a DATABASE
      update.
  /*/
  UDATA.HandleMessage("EDGE_UPDATE", function(data) {
    let { edge } = data;
    // edge.source and edge.target are initially ids
    // replace then with node data
    edge.source = m_FindNodeById(edge.source);
    edge.target = m_FindNodeById(edge.target);
    // set matching nodes
    let updatedEdges = m_SetMatchingEdgesByProp({ id: edge.id }, edge);
    if (DBG) console.log("EDGE_UPDATE: updated", updatedEdges);

    // if no nodes had matched, then add a new node!
    if (updatedEdges.length === 0) {
      if (DBG) console.log("EDGE_UPDATE: pushing edge", edge);
      // created edges should have a default size
      edge.size = 1;
      D3DATA.edges.push(edge);
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
    }
    // if there was one node
    if (updatedEdges.length === 1) {
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
      edge.size = m_CalculateEdgeWeight(edge, D3DATA.edges);
    }
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
}); // end UNISYS_INIT

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
      "EDGE_DELETE"
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

/// NODE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Convert all IDs to integers
    Node and Edge IDs should be integers.
    This isn't a problem with newly created datasets as the network-generated IDs
    are integers.  However, with older data sets, the IDs may have been strings.
    e.g. exports from Gephi will have string IDs.
    This mismatch is a problem when looking up nodes by ID.
      `data` is passed by reference
      This modifies `data`
      data = { nodes: [], edges: [] }
/*/
function m_ConvertData(data) {
  data.nodes.forEach(node => {
    node.id = parseInt(node.id);
  });
  data.edges.forEach(edge => {
    edge.id = parseInt(edge.id);
    // before D3 processing, edge.source and edge.target are ids
    edge.source = parseInt(edge.source);
    edge.target = parseInt(edge.target);
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
  let marked = { selected: SOURCE_COLOR };
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
/*/ Command: Token Generator
/*/
JSCLI.AddFunction(function ncMakeTokens(clsId, projId, numGroups) {
  // type checking
  if (typeof clsId !== "string")
    return "args: str classId, str projId, int numGroups";
  if (typeof projId !== "string")
    return "args: str classId, str projId, int numGroups";
  if (clsId.length > 12) return "classId arg1 should be 12 chars or less";
  if (projId.length > 12) return "classId arg1 should be 12 chars or less";
  if (!Number.isInteger(numGroups)) return "numGroups arg3 must be integer";
  if (numGroups < 1) return "numGroups arg3 must be positive integeger";
  // let's do this!
  let out = `\nTOKEN LIST for class '${clsId}' project '${projId}'\n\n`;
  let pad = String(numGroups).length;
  for (let i = 1; i <= numGroups; i++) {
    let id = String(i);
    id = id.padStart(pad, "0");
    out += `group ${id}\t${SESSION.MakeToken(clsId, projId, i)}\n`;
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
