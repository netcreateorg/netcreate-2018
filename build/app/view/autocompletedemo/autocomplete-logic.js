/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  * EVENTS: D3 Graph Updates

    Mark Node/Edge          When a node or edge is higlighted via an AutoComplete
                            highlight or is selected via AutoComplete selection
                            or clicked on in NetGraph, it is shown bold (or
                            outlined) in the D3 graph.  This is done by updating
                            the node or edge in `this.state.data` object, setting
                            the object's `selected` key to a particular color
                            corresponding to the node/edge UI control.  When
                            the data is updated, it is passed to `NetGraph.jsx`,
                            which in turn updates the data in
                            `D3SimpleNetGraph.js`.  `D3SimpleNetGraph` will add
                            the highlight during its update cycle.

                            The colors allow us to highlight different fields
                            simultaneously with each component.  For example,
                            you can highlight both the source and target nodes
                            with different colors so you know which is which.
                            This is especially useful when the highlight matches
                            many objects, e.g. "Ah" matches 7 different nodes.

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
    * activeAutoCompleteId: id of active <AutoComplete> field
        of form: 'node-xx' or 'edge-source-xx' or 'edge-target-xx'
        where xx = the id of the <AutoComplete> field that has input focus.
        This is used to keep track of the currently active
        AutoComplete field. Inactive fields and updates are determined by
        the value of this property.
    * nodes: an array of current selected nodes for editing.
        This is the node the user clicked on in the graph or selected from
        the suggestions list
    * edges: an array of edge objects for editing
        *REVIEW*: Should this be renamed "selectedEdges" to distinguish from
        *D3DATA.edge
    * searchLabel: a string representing what the user has typed
    * suggestedNodeLabels: an array of suggested nodes
        node labels suggestions match the current search string
    * hilitedNode: node object that user has rolled-over in suggestion list
        user has not clicked yet, but is browsing through the list
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
const SOURCE_COLOR     = '#0000DD'
const TARGET_COLOR     = '#FF0000'


/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ LOADASSETS fires during <AutoCompleteDemo>.componentDidMount
/*/ MOD.Hook('LOADASSETS',()=>{
      // load data into D3DATA
      DATASTORE.LoadDataPromise()
      .then((data)=>{
        console.log(PR,'DATASTORE returned data',data);
        D3DATA = data;
        UDATA.SetState('D3DATA',D3DATA);
      });
    }); // end INITIALIZE HOOK

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/ MOD.Hook('INITIALIZE', () => {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ Handle D3-related updates based on state changes. Subcomponents are
      responsible for updating themselves.
  /*/ UDATA.OnStateChange('SELECTION',( stateChange ) => {
        let { nodes, edges } = stateChange;
        let { searchLabel } = stateChange;
        let { activeAutoCompleteId } = stateChange;
        // NODE LIST UPDATE
        if (nodes!==undefined) {
          if (nodes.length>0) {
            let color = '#0000DD';
            nodes.forEach( node => m_MarkNodeById(node.id,color));
          } else {
            m_UnMarkAllNodes();
          }
        }
        // SEARCH LABEL UPDATE
        if (searchLabel) m_MarkNodesThatMatch(searchLabel,SOURCE_COLOR);
      }); // StateChange SELECTION
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_SELECT set the selected node by LABEL. There is one selected node
      in the app at any one time, though nodeLabels is passed as an array.
      SEE ALSO: AutoComplete.onSuggestionSelected() and
                D3SimpleNetGraph._UpdateGraph click handler
  /*/ UDATA.HandleMessage('SOURCE_SELECT', function( data ) {
        let { nodeLabels=[] } = data;
        let nodeLabel = nodeLabels.shift();
        let node = m_FindMatchingNodesByLabel(nodeLabel).shift();
        let newState;

        if (node===undefined) {
          newState = {
            nodes                 : [],
            edges                 : [],
            searchLabel           : '',
            activeAutoCompleteId  : 'nodeSelector'
          };
          // update visuals
          // m_UnMarkAllNodes();
        } else {
          let edges = [];
          edges = edges.concat( D3DATA.edges.filter( edge => edge.source.label===nodeLabel || edge.target.label===nodeLabel) );
          // create state change object
          newState = {
            nodes                 : [ node ],
            edges,
            searchLabel           : node.label
          };
          // update visuals
          // let color = '#0000DD';
          // m_MarkNodeById( node.id, color );
        }
        // let SELECTION state listeners handle display updates
        UDATA.SetState('SELECTION',newState);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_SEARCH sets the current matching term as entered in an
      AutoComplete field.
  /*/ UDATA.HandleMessage('SOURCE_SEARCH', function( data ) {
        let { searchString } = data;
        let matches = m_FindMatchingNodesByLabel(searchString);
        let newState = {
          suggestedNodeLabels : matches.map(n=>n.label),
          searchLabel         : searchString,
          nodes               : []
        };
        // let SELECTION state listeners handle display updates
        UDATA.SetState('SELECTION',newState);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_HILITE updates the currently rolled-over node name in a list of
      selections.
  /*/ UDATA.HandleMessage('SOURCE_HILITE', function( data ) {
        let { nodeLabel, color } = data;
        if (nodeLabel) {
          // Only mark nodes if something is selected
          m_UnMarkAllNodes();
          m_MarkNodeByLabel(nodeLabel,SOURCE_COLOR);
        }
        let hilitedNode = m_FindMatchingNodesByLabel(nodeLabel).shift();
        // let HIGHLIGHT state listeners handle display updates
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ SOURCE_UPDATE is called when the properties of a node has changed
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
          DATASTORE.Update({ op:'update', newNode });
        }
        if (updatedNodes.length>1) {
          throw Error("SourceUpdate found duplicate IDs");
        }
        UDATA.SetState('D3DATA',D3DATA);
        UDATA.SetState('SELECTION',{ searchLabel : '' });      // let SELECTION state listeners handle display updates
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_UPDATE is called when the properties of an edge has changed
  /*/ UDATA.HandleMessage('EDGE_UPDATE', function( data ) {
        let { edge } = data;
        let attribs = {
          'Relationship' : edge.attributes['Relationship'],
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
          DATASTORE.Update({ op:'insert', newEdge });
          D3DATA.edges.push(newEdge);
        }
        if (updatedEdges.length===1) {
          DATASTORE.Update({ op:'update', newEdge });
        }
        if (updatedEdges.length>1) {
          throw Error("EdgeUpdate found duplicate IDs");
        }
        UDATA.SetState('D3DATA',D3DATA);
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ EDGE_DELETE is called when an edge should be removed from...something?
  /*/ UDATA.HandleMessage('EDGE_DELETE', function( data ) {
        let { edgeID } = data;
        // remove specified edge from edge list
        D3DATA.edges = m_DeleteMatchingEdgeByProp({id:edgeID});
        // Also update selection so edges in EdgeEditor will update
        // This works because of a HACKY SIDE EFFECT of the NodeSelector
        // SELECTION state handler which should be fixed
        let { searchLabel } = UDATA.State('SELECTION');
        UDATA.SetState('SELECTION',{
          searchLabel,
          nodes                : D3DATA.nodes,
          edges                : D3DATA.edges,
          activeAutoCompleteId : 'nodeSelector'
        });
      });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /*/ AUTOCOMPLETE_SELECT is called by <AutoComplete> components to tell the
      module which one has the current focus. The searchString is also passed
      so a display update can be triggered immediately.
  /*/ UDATA.HandleMessage('AUTOCOMPLETE_SELECT', function( data ) {
        let { id, searchString='' } = data;
        // update SELECTION state object
        /*REVIEW* treading the selection shouldn't be necessary*/
        let selection = UDATA.State('SELECTION');
        selection.activeAutoCompleteId = id;
        selection.searchLabel          = searchString;
        UDATA.SetState('SELECTION',selection);
      });
    }); // end UNISYS_INIT

/// APP_READY MESSAGE REGISTRATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/ MOD.Hook('APP_READY', function( info ) {
      /// RETURN PROMISE to prevent phase from continuing until after registration
      /// of messages is successful
      return new Promise((resolve,reject) => {
        console.log(`${PR}HOOK 'UNISYS_INIT' Registering Message Handlers...`);
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
          console.log(`${PR}HOOK 'UNISYS_INIT' Registered Message Handlers ${JSON.stringify(d.registered)}`);
          console.log(`INFO: %cMy socket address is ${UNISYS.SocketUADDR()}`,'color:blue;font-weight:bold' );
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
      UDATA.SetState('D3DATA',D3DATA);
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
      UDATA.SetState('D3DATA',D3DATA);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Sets the `node.selected` property to `color` so it is hilited on graph
/*/ function m_MarkNodeByLabel( label, color ) {
      let marked = { selected : color };
      // NOTE: this.getSelectedNodeColor(node,color) and
      // this.getDeselectedNodeColor(node,color) are not yet implemented
      // to override the properties
      m_SetMatchingNodesByLabel(label,marked);
      UDATA.SetState('D3DATA',D3DATA);
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
      UDATA.SetState('D3DATA',D3DATA);
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
      UDATA.SetState('D3DATA',D3DATA);
      return "SetState 'D3DATA'";
    };

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
