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
                            AutoCompleteDemo will update its `this.state.data`
                            with the new nodes/edges.  This is passed on to
                            `NetGraph.jsx` and in turn to `D3SimpleNetGraph.js`
                            which will display the new data during its update
                            cycle.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG        = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS     = require('unisys/client');
const D3         = require('d3');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   MOD        = UNISYS.NewModule(module.id);
var   UDATA      = UNISYS.NewDataLink(MOD);

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
    by autocomplete-logic in response to SOURCE_SEARCH calls -- autocomplete-logic
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
var   D3DATA           = null;    // see above for description
const DATASTORE        = require('system/datastore');
const PROMPTS          = require('system/util/prompts');
const PR               = PROMPTS.Pad('ACDLogic');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DESELECTED_COLOR = '';
const SEARCH_COLOR     = '#008800';
const SOURCE_COLOR     = '#0000DD';
const TARGET_COLOR     = '#FF0000';


/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ LOADASSETS fires during <AutoCompleteDemo>.componentDidMount
/*/ MOD.Hook('LOADASSETS',()=>{
      // load data into D3DATA
      DATASTORE.LoadDataPromise()
      .then((data)=>{
        if (DBG) console.log(PR,'DATASTORE returned data',data);
        D3DATA = data;
        UDATA.SetAppState('D3DATA',D3DATA);
      });
    }); // end INITIALIZE HOOK

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/ MOD.Hook('INITIALIZE', () => {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ Handle D3-related updates based on state changes. Subcomponents are
      responsible for updating themselves.
  /*/ UDATA.OnAppStateChange('SELECTION',( stateChange ) => {
        if (DBG) console.log('autocomplete-logic: Got SELECTION', stateChange);
        let { nodes, edges } = stateChange;
        // NODE LIST UPDATE
        if (nodes!==undefined) {
          if (nodes.length>0) {
            let color = '#0000DD';
            nodes.forEach( node => m_MarkNodeById(node.id,color));
          } else {
            m_UnMarkAllNodes();
          }
        }
      }); // StateChange SELECTION
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ Search field has been updated
  /*/ UDATA.OnAppStateChange('SEARCH',( stateChange ) => {
        if (DBG) console.log('autocomplete-logic: Got SEARCH', stateChange);
        let { nodes, edges }         = stateChange;
        let { searchLabel }          = stateChange;
        let { activeAutoCompleteId } = stateChange;
        // NODE LIST UPDATE
        if (nodes!==undefined) {
          if (nodes.length>0) {
            let color = SEARCH_COLOR;
            nodes.forEach( node => m_MarkNodeById(node.id,color));
          } else {
            m_UnMarkAllNodes();
          }
        }
        // SEARCH LABEL UPDATE
        if (searchLabel==='') {
          m_UnStrokeAllNodes();
        } else if (searchLabel!==undefined) {
          m_SetStrokeColorThatMatch(searchLabel,SEARCH_COLOR);
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
  /*/ UDATA.HandleMessage('SOURCE_SELECT', function( data ) {
        let { nodeLabels=[], nodeIDs=[] } = data;
        let nodeLabel = nodeLabels.shift();
        let nodeID    = nodeIDs.shift();
        let node, newState;

        if (nodeID) {
          node = m_FindNodeById(nodeID);
        } else if (nodeLabel) {
          node = m_FindMatchingNodesByLabel(nodeLabel).shift();
        } else {
          // No node selected, so deselect
        }

        if (DBG) console.log('ACL: SOURCE_SELECT got',node);

        if (node===undefined) {
          // Node not found, create a new node
          newState = {
            nodes                 : [],
            edges                 : []
          };
        } else {
          // Load existing node and edges
          let edges = [];
          if (nodeID) {
            edges = edges.concat( D3DATA.edges.filter( edge => edge.source.id===nodeID || edge.target.id===nodeID) );
          } else {
            edges = edges.concat( D3DATA.edges.filter( edge => edge.source.label===nodeLabel || edge.target.label===nodeLabel) );
          }
          // create state change object
          newState = {
            nodes                 : [ node ],
            edges                 : edges
          };
        }

        // Set the SELECTION state so that listeners such as NodeSelectors update themselves
        UDATA.SetAppState('SELECTION',newState);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_SEARCH sets the current matching term as entered in an
      AutoComplete field.
  /*/ UDATA.HandleMessage('SOURCE_SEARCH', function( data ) {
        let { searchString } = data;
        let matches = m_FindMatchingNodesByLabel(searchString);
        let newState = {
          suggestedNodes      : matches.map(n=>{return {id: n.id, label: n.label}}),
          searchLabel         : searchString
        };
        // let SELECTION state listeners handle display updates
        UDATA.SetAppState('SEARCH',newState);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_HILITE updates the currently rolled-over node name in a list of
      selections.  The hilite can be selected via either the label or
      the node id.
  /*/ UDATA.HandleMessage('SOURCE_HILITE', function( data ) {
        let { nodeLabel, nodeID, color } = data;
        if (nodeLabel) {
          // Only mark nodes if something is selected
          m_UnMarkAllNodes();
          m_MarkNodeByLabel(nodeLabel,SOURCE_COLOR);
        }
        if (nodeID) {
          // Only mark nodes if something is selected
          m_UnMarkAllNodes();
          m_MarkNodeById(nodeID,SOURCE_COLOR);
        }

        // NOTE: State is updated in the "MaryNodeBy*" functions above.
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_UPDATE is called when the properties of a node has changed
      Globally updates DATASTORE and working D3DATA objects with the new node data.
  /*/ UDATA.HandleMessage('SOURCE_UPDATE', function( data ) {
        let { node } = data;
        let attribs = {
          'Node_Type'  : node.type,
          'Extra Info' : node.info,
          'Notes'      : node.notes
        };
        let newNode = {
          label        : node.label,
          attributes   : attribs,
          id           : node.id
        };
        // set matching nodes
        let updatedNodes = m_SetMatchingNodesByProp({id:node.id},newNode);
        if (DBG) console.log('HandleSourceUpdate: updated',updatedNodes);
        // if no nodes had matched, then add a new node!
        if (updatedNodes.length===0) {
          if (DBG) console.log('pushing node',newNode);
          DATASTORE.Update({ op:'insert', newNode });
          D3DATA.nodes.push(newNode);
        }
        if (updatedNodes.length===1) {
          if (DBG) console.log('updating existing node',newNode);
          DATASTORE.Update({ op:'update', node: newNode });
        }
        if (updatedNodes.length>1) {
          throw Error("SourceUpdate found duplicate IDs");
        }
        UDATA.SetAppState('D3DATA',D3DATA);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_UPDATE is called when the properties of an edge has changed
  /*/ UDATA.HandleMessage('EDGE_UPDATE', function( data ) {
        let { edge } = data;
        let attribs = {
          'Relationship' : edge.attributes['Relationship'],
          'Info'         : edge.attributes['Info'],
          'Citations'    : edge.attributes['Citations'],
          'Notes'        : edge.attributes['Notes']
        };
        let newEdge = {
          source         : m_FindNodeById(edge.source),
          target         : m_FindNodeById(edge.target),
          attributes     : attribs,
          id             : edge.id
        };
        // set matching nodes
        let updatedEdges = m_SetMatchingEdgesByProp({id:edge.id},newEdge);
        if (DBG) console.log('HandleEdgeUpdate: updated',updatedEdges);
        // if no nodes had matched, then add a new node!
        if (updatedEdges.length===0) {
          if (DBG) console.log('pushing edge',newEdge);
          // created edges should have a default size
          newEdge.size = 1;
          D3DATA.edges.push(newEdge);

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
          newEdge.source = newEdge.source.id;
          newEdge.target = newEdge.target.id;

          DATASTORE.Update({ op:'insert', newEdge });
        }
        if (updatedEdges.length===1) {

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
          newEdge.source = newEdge.source.id;
          newEdge.target = newEdge.target.id;

          DATASTORE.Update({ op:'update', edge:newEdge });
        }
        if (updatedEdges.length>1) {
          throw Error("EdgeUpdate found duplicate IDs");
        }
        UDATA.SetAppState('D3DATA',D3DATA);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_DELETE is called when an edge should be removed from...something?
  /*/ UDATA.HandleMessage('EDGE_DELETE', function( data ) {
        let { edgeID } = data;
        // remove specified edge from edge list
        D3DATA.edges = m_DeleteMatchingEdgeByProp({id:edgeID});
        UDATA.SetAppState('D3DATA',D3DATA);
        // Also update selection so edges in EdgeEditor will update
        let selection = UDATA.AppState('SELECTION');
        if ((selection.nodes===undefined) || (selection.nodes.length<1) || (selection.nodes[0].id===undefined)) {
          throw Error('autocomplete-logic.EDGE_DELETE can\'t find source node!  This shoudln\'t happen!');
        }
        let nodeID = selection.nodes[0].id;
        let edges = [];
        // Remove the deleted edge from the selection
        if ((selection.edges!==undefined) && (selection.edges.length>0)) {
          edges = edges.concat( selection.edges.filter( edge => edge.id!==edgeID ));
        }
        UDATA.SetAppState('SELECTION',{
          nodes: selection.nodes,
          edges: edges
        });
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ AUTOCOMPLETE_SELECT is called by <AutoComplete> components to tell the
      module which one has the current focus.
  /*/ UDATA.HandleMessage('AUTOCOMPLETE_SELECT', function( data ) {
        m_HandleAutoCompleteSelect( data );
      });
    }); // end UNISYS_INIT
    function m_HandleAutoCompleteSelect ( data ) {
      if (DBG) console.log('ACL: Setting activeAutoCompleteId to',data.id);
      UDATA.SetAppState('ACTIVEAUTOCOMPLETE',{
        activeAutoCompleteId: data.id
      });
    }

/// APP_READY MESSAGE REGISTRATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/ MOD.Hook('APP_READY', function( info ) {
      /// RETURN PROMISE to prevent phase from continuing until after registration
      /// of messages is successful
      return new Promise((resolve,reject) => {
        if (DBG) console.log(`${PR}HOOK 'UNISYS_INIT' Registering Message Handlers...`);
        // timeout for broken network registration
        let timeout = setTimeout(()=>{
          reject(new Error('UNISYS REGISTER TIMEOUT'));
        },5000);

        // register ONLY messages we want to make public
        UNISYS.RegisterMessagesPromise([
          'SOURCE_UPDATE',
          'EDGE_UPDATE',
          'EDGE_DELETE'
        ])
        .then((d)=>{
          clearTimeout(timeout);
          if (DBG) console.log(`${PR}HOOK 'UNISYS_INIT' Registered Message Handlers ${JSON.stringify(d.registered)}`);
          if (DBG) console.log(`INFO: %cMy socket address is ${UNISYS.SocketUADDR()}`,'color:blue;font-weight:bold' );
          resolve();
        });
      });
    }); // end UNISYS_READY


/// OBJECT HELPERS ////////////////////////////////////////////////////////////
/// these probably should go into a utility class
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of objects that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/ function m_FindMatchingObjsByProp( obj_list, match_me={} ) {
      // operate on arrays only
      if (!Array.isArray(obj_list)) throw Error("FindMatchingObjectsByProp arg1 must be array");
      let matches = obj_list.filter( obj => {
        let pass = true;
        for (let key in match_me) {
          if (match_me[key]!==obj[key]) pass=false; break;
        }
        return pass;
      });
      // return array of matches (can be empty array)
      return matches;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Set array of objects that match to key/values of yes/no respectively
    Returns array of matched objects
?*/ function m_SetMatchingObjsByProp( obj_list, match_me={}, yes={}, no={} ) {
      // operate on arrays only
      if (!Array.isArray(obj_list)) throw Error("SetMatchingObjsByPropp arg1 must be array");

      let returnMatches = [];
      obj_list.forEach( node => {
        let matched = true;
        for (let key in match_me) {
          if (match_me[key]!==node[key]) matched=false; break;
        }
        if (matched) {
          for (let key in yes) node[key]=yes[key];
          returnMatches.push(node);
        } else {
          for (let key in no) node[key]=no[key];
        }
      });
      return returnMatches;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of everything in obj_list
/*/ function m_SetAllObjs( obj_list, all={} ) {
      // operate on arrays only
      if (!Array.isArray(obj_list)) throw Error("SetAllNodes arg1 must be array");
      obj_list.forEach(obj => {
        for (let key in all) obj[key]=all[key];
      });
    }

/// NODE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of nodes that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/ function m_FindMatchingNodeByProp( match_me={} ) {
      return m_FindMatchingObjsByProp(D3DATA.nodes,match_me);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Convenience function to retrieve node by ID
/*/ function m_FindNodeById( id ) {
      return m_FindMatchingNodeByProp({ id })[0];
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of nodes with labels that partially match str
/*/ function m_FindMatchingNodesByLabel( str='' ) {
      if (!str) return [];
      str = u_EscapeRegexChars(str.trim());
      if (str==='') return [];
      const regex = new RegExp(/*'^'+*/str,'i');
      return D3DATA.nodes.filter(node=>regex.test(node.label));
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Set nodes that PARTIALLY match 'str' to 'yes' props.
    All others nodes are set to 'no' props. Return matches
    Optionally resets all the NON matching nodes as well
/*/ function m_SetMatchingNodesByLabel( str='', yes={}, no={} ) {
      let returnMatches = [];
      str = u_EscapeRegexChars(str.trim());
      if (str==='') return undefined;
      const regex = new RegExp(/*'^'+*/str,'i');
      D3DATA.nodes.forEach(node => {
        if (regex.test(node.label)) {
          for (let key in yes) node[key]=yes[key];
          returnMatches.push(node);
        } else {
          for (let key in no) node[key]=no[key];
        }
      });
      return returnMatches;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of exact matching nodes, returns matches
    Optionally resets all the NON matching nodes as well
/*/ function m_SetMatchingNodesByProp( match_me={}, yes={}, no={} ) {
      return m_SetMatchingObjsByProp( D3DATA.nodes, match_me, yes, no );
    }

/// EDGE HELPERS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of edges that DON'T match del_me object keys/values
/*/ function m_DeleteMatchingEdgeByProp( del_me={} ) {
      let matches = D3DATA.edges.filter( (edge) => {
        let pass = false;
        for (let key in del_me) {
          if (del_me[key]!==edge[key]) {
            pass=true; break;
          }
        }
        return pass;
      });
      // return array of matches (can be empty array)
      return matches;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of exact matching edges, returns matches
/*/ function m_SetMatchingEdgesByProp( match_me={}, yes={}, no={} ) {
      return m_SetMatchingObjsByProp( D3DATA.edges, match_me, yes, no );
    }

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ REGEX: the chars in brackets are part of matching character set.
    Declaring this as a constant makes the RegEx run faster (I think).
/*/ const REGEX_REGEXCHARS = /[.*+?^${}()|[\]\\]/g;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Adds a \ in front of characters that have special RegEx meaning
    From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expression
/*/ function u_EscapeRegexChars( string ) {
      return string.replace(REGEX_REGEXCHARS,'\\$&'); // $& means the whole matched string
    }

/// NODE MARKING METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Visually change all nodes to the deselected color
/*/ function m_UnMarkAllNodes() {
      let props = { selected : DESELECTED_COLOR };
      m_SetAllObjs(D3DATA.nodes,props);
      UDATA.SetAppState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Remove the stroke color.  Used to unmark search matches.
/*/ function m_UnStrokeAllNodes() {
      let props = { strokeColor : undefined };
      m_SetAllObjs(D3DATA.nodes,props);
      UDATA.SetAppState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the `node.selected` property to `color` so it is hilited on graph
/*/ function m_MarkNodeById( id, color ) {
      let marked = { selected : SOURCE_COLOR };
      let normal = { selected : DESELECTED_COLOR };
      // NOTE: this.getSelectedNodeColor(node,color) and
      // this.getDeselectedNodeColor(node,color) are not yet implemented
      // to override the properties
      m_SetMatchingNodesByProp({id},marked,normal);
      UDATA.SetAppState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the `node.selected` property to `color` so it is hilited on graph
/*/ function m_MarkNodeByLabel( label, color ) {
      let marked = { selected : color };
      let normal = { selected : DESELECTED_COLOR };
      // NOTE: this.getSelectedNodeColor(node,color) and
      // this.getDeselectedNodeColor(node,color) are not yet implemented
      // to override the properties
      m_SetMatchingNodesByLabel(label,marked,normal);
      UDATA.SetAppState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets matching node labels to the passed selection color
/*/ function m_MarkNodesThatMatch( searchString, color ) {
      if (searchString==='') {
        m_UnMarkAllNodes();
        return;
      }
      let select   = { selected : color };
      let deselect = { selected : DESELECTED_COLOR };
      m_SetMatchingNodesByLabel(searchString, select, deselect);
      UDATA.SetAppState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets matching node labels to the passed selection color
    This sets the stroke color, which is used to display
    the matching nodes during a search.  If the node is
    also selected, the selected color will override this color.
/*/ function m_SetStrokeColorThatMatch( searchString, color ) {
      let matched    = { strokeColor : color };
      let notmatched = { strokeColor : undefined };
      m_SetMatchingNodesByLabel(searchString, matched, notmatched);
      UDATA.SetAppState('D3DATA',D3DATA);
    }


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TODO: THESE STILL NEED TO BE CONVERTED
///
/// These are methods for marking edges and nodes with multiple colors.
/// Multiple color marking is not currently implemented.
//
//   /// Only select nodes that have not already been selected
//   getSelectedNodeColor ( node, color ) {
//     if (node.selected===undefined || node.selected===DESELECTED_COLOR) {
//       return color
//     } else {
//       return node.selected    // default to existing color
//     }
//   }
//   /// Only deselect nodes that were selected by this instance, ignore selections
//   /// from other NodeSelectors
//   /*STYLE*/// this is called from deselectAllNodes without specifying 'color'. what is intent?
//   /*STYLE*/// what is an 'NodeSelector instance'? a set of matching nodes? premature optimization?
//   getDeselectedNodeColor ( node, color ) {
//     if (node.selected!==color ) { // this.props.selectedColor) {
//       return node.selected /*STYLE*/// node.selected is a color AND a truthy value???
//     } else {
//       return DESELECTED_COLOR
//     }
//   }
//   ///
//   /// EDGES
//   ///
//   markSelectedEdgeById( id ) {
// // REMOVE because marking is now handled by acl?
//     // let updatedData = this.state.data
//     // updatedData.edges = this.state.data.edges.map( edge => {
//     //   edge.selected = (edge.id===id)  /*STYLE*/// edge.selected doesn't mirror node.selected in value type (node.selected is a color)
//     //   return edge
//     // })
//     // this.setState( { data: updatedData })
//   }

/// DEBUG CONSOLE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    window.FindMatchingNodesByProp  = m_FindMatchingNodeByProp;
    window.FindMatchingNodesByLabel = m_FindMatchingNodesByLabel;
    window.SetMatchingNodesByLabel  = m_SetMatchingNodesByLabel;
    window.SetMatchingNodesByProp   = m_SetMatchingNodesByProp;
    window.SetAllObjs               = m_SetAllObjs;
    window.UpdateD3Data             = function () {
      UDATA.SetAppState('D3DATA',D3DATA);
      return "SetState 'D3DATA'";
    };

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
