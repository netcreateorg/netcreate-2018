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

/// DEBUG CONSOLE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    window.FindMatchingNodesByProp  = m_FindMatchingNodeByProp;
    window.FindMatchingNodesByLabel = m_FindMatchingNodesByLabel;
    window.SetMatchingNodesByLabel  = m_SetMatchingNodesByLabel;
    window.SetMatchingNodesByProp   = m_SetMatchingNodesByProp;
    window.SetAllNodes              = m_SetAllNodes;
    window.UpdateD3Data             = function () {
      UDATA.SetState('D3DATA',D3DATA);
      return "SetState 'D3DATA'";
    };

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS     = require('system/unisys');
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
var   SELECTION        = {};      // see above for description
var   D3DATA           = null;    // see above for description

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
      let dataSource = "http://localhost:3000/htmldemos/d3forcedemo/data.reducedlinks.json";
      D3.json(dataSource, ( error, _data )=>{
        if (error) throw Error(error);
        D3DATA = _data;
        // initialize global state D3DATA as well
        UDATA.SetState('D3DATA',D3DATA);
      }); // end D3.json load
    }); // end INITIALIZE HOOK



/// STATE CHANGE HANDLERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle D3-related updates based on state changes. Subcomponents are
    responsible for updating themselves.
/*/ UDATA.OnStateChange('SELECTION',( stateChange ) => {

      let { nodes, edges } = stateChange;
      let { searchLabel } = stateChange;
      let { activeAutoCompleteId } = stateChange;

      // NODE LIST UPDATE
      if (nodes!=undefined) {
        if (nodes.length>0) {
          let color = '#0000DD';
          nodes.forEach( node => m_MarkNodeById(node.id,color));
        } else {
          m_UnMarkAllNodes();
        }
      }
      // SEARCH LABEL UPDATE
      if (searchLabel) m_MarkNodesThatMatch(searchLabel,SOURCE_COLOR);

    });



/// UNISYS MESSAGE HANDLERS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these should set state appropriately, and state handlers elsewhere should
/// respond to state changes
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ SOURCE_SELECT set the selected node by LABEL. There is one selected node in
    the app at any one time, though nodeLabels is passed as an array.
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
          edges                 : edges,
          searchLabel           : node.label
        };
        // update visuals
        // let color = '#0000DD';
        // m_MarkNodeById( node.id, color );
      }
      // update state
      UDATA.SetState('SELECTION',newState);
      // at this point, SELECTION state subscribers should process and update
      // rather than invoking them here.
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ SOURCE_SEARCH sets the current matching term as entered in an AutoComplete
    field.
/*/ UDATA.HandleMessage('SOURCE_SEARCH', function( data ) {
      let { searchString } = data;
      if (!searchString) throw ('expected searchString property');
      let matches = m_FindMatchingNodesByLabel(searchString);
      let newState = {
        suggestedNodeLabels : matches.map(n=>n.label),
        searchLabel         : searchString,
        nodes               : [] // undefined // style this should be [] ideally
      };
      UDATA.SetState('SELECTION',newState);
      // at this point, SELECTION state subscribers should process and update
      // rather than invoking them here.
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ SOURCE_HILITE updates the currently rolled-over node name in a list of
    selections.
/*/ UDATA.HandleMessage('SOURCE_HILITE', function( data ) {
      let { nodeLabel, color } = data;
      m_HandleSourceHilite(nodeLabel);
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ SOURCE_UPDATE is called when the properties of a node has changed
/*/ UDATA.HandleMessage('SOURCE_UPDATE', function( data ) {
      let { node } = data;
      m_HandleSourceUpdate(node);
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EDGE_UPDATE is called when the properties of an edge has changed
/*/ UDATA.HandleMessage('EDGE_UPDATE', function( data ) {
      let { edge } = data;
      m_HandleEdgeUpdate(edge);
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EDGE_DELETE is called when an edge should be removed from...something?
/*/ UDATA.HandleMessage('EDGE_DELETE', function( data ) {
      let { edgeID } = data;
      m_HandleEdgeDelete(edgeID);
    })
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    })



/// NODE HELPERS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return array of nodes that match the match_me object keys/values
    NOTE: make sure that strings are compared with strings, etc
/*/ function m_FindMatchingNodeByProp( match_me={} ) {
      let matches = D3DATA.nodes.filter( node => {
        let pass = true;
        for (let key in match_me) {
          if (match_me[key]!==node[key]) pass=false; break;
        }
        return pass;
      });
      // return array of matches (can be empty array)
      return matches;
    };
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
/*/ Convenience function to retrieve node by ID
/*/ function m_FindNodeById( id ) {
      return m_FindMatchingNodeByProp({ id })[0];
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Set nodes that PARTIALLY match 'str' to 'yes' props.
    All others nodes are set to 'no' props.
/*/ function m_SetMatchingNodesByLabel( str='', yes={}, no={} ) {
      str = u_EscapeRegexChars(str.trim());
      if (str==='') return;
      const regex = new RegExp(/*'^'+*/str,'i');
      D3DATA.nodes.forEach (node => {
        if (regex.test(node.label)) {
          for (let key in yes) node[key]=yes[key];
        } else {
          for (let key in no) node[key]=no[key];
        }
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of exact matching nodes
/*/ function m_SetMatchingNodesByProp( match_me={}, yes={}, no={} ) {
      D3DATA.nodes.forEach( node => {
        let matched = true;
        for (let key in match_me) {
          if (match_me[key]!==node[key]) matched=false; break;
        }
        if (matched) {
          for (let key in yes) node[key]=yes[key];
        } else {
          for (let key in no) node[key]=no[key];
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Update props of ALL nodes
/*/ function m_SetAllNodes( all={} ) {
      D3DATA.nodes.forEach(node => {
        for (let key in all) node[key]=all[key];
      });
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
      m_SetAllNodes(props);
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



/// LOGIC METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_HandleNodeSelect( nodeLabel ) {
      let node = m_FindMatchingNodesByLabel(nodeLabel).shift();

      if (node===undefined) { // UNSELECT ALL NODES //

        // create state change object
        let emptyState = {
          // clear all selections
          nodes       : [],
          edges       : [],
          searchLabel : '',
          // make NodeSelector's AutoComplete the default
          activeAutoCompleteId : 'nodeSelector'
        };
        // update state
        UDATA.SetState('SELECTION',emptyState);
        // update visuals
        m_UnMarkAllNodes();

      } else { // SELECT NODE //

        // find connected edges to this selection
        let edges = [];
        edges = edges.concat( D3DATA.edges.filter( edge => edge.source.label===nodeLabel || edge.target.label===nodeLabel) );
        // create state change object
        let selectState = {
          nodes        : node,
          edges        : edges,
          searchLabel  : node.label
        };
        // update state
        UDATA.SetState('SELECTION',selectState);
        // update visuals
        let color = '#0000DD';
        m_MarkNodeById( node.id, color );
      }
    }

/// User has moused over (or keyboard-arrowed-over) an item in the suggestion list
function m_HandleSourceHilite (nodeLabel) {
  if (nodeLabel) {
    // Only mark nodes if something is selected
    m_UnMarkAllNodes();
    m_MarkNodeByLabel( nodeLabel, SOURCE_COLOR );
  }

  // Update hilitedNode in SELECTION
  // Always update hilitedNode so that NodeDetail will update
  let hilitedNode = m_FindMatchingNodesByLabel(nodeLabel).shift();

  let selection = UDATA.State('SELECTION');
  selection.hilitedNode = hilitedNode;
  UDATA.SetState('SELECTION',selection);
}


/// User has hit Save to save a node
/// Update existing node, or add a new node
function m_HandleSourceUpdate (newNodeData) {
  if (DBG) console.log('autocomplete-logic.m_HandleSourceUpdate',newNodeData);
  let found = false;
  D3DATA.nodes = D3DATA.nodes.map( node => {
    if (node.id === newNodeData.id) {
      node.label                    = newNodeData.label;
      node.attributes["Node_Type"]  = newNodeData.type;
      node.attributes["Extra Info"] = newNodeData.info;  /*STYLE*/// why switch between _ and space?
      node.attributes["Notes"]      = newNodeData.notes;
      node.id                       = newNodeData.id;
      if (DBG) console.log('...updated existing node',node.id);
      found = true;
    }
    return node;
  });
  if (!found) {
    // Add a new node
    if (DBG) console.log('...adding new node',newNodeData.id);
    let node = {attributes:{}};
    node.label                    = newNodeData.label;
    node.attributes["Node_Type"]  = newNodeData.type;
    node.attributes["Extra Info"] = newNodeData.info;
    node.attributes["Notes"]      = newNodeData.notes;
    node.id                       = newNodeData.id;
    D3DATA.nodes.push(node);
  }

  UDATA.SetState('D3DATA',D3DATA);

  // Clear search field
  let selection = UDATA.State('SELECTION');
  selection.searchLabel = '';
  UDATA.SetState('SELECTION',selection);
}


/// User has requested a new edge be created or updated
function m_HandleEdgeUpdate (edgeNode) {
  if (DBG) console.log('autocomplete-logic:m_HandleCreateEdge',edgeNode);

  // Are we creating a new edge, or updating existing edge?
  let found = false;
  // Update existing node?
  D3DATA.edges = D3DATA.edges.map( edge => {
    if (edge.id === edgeNode.id) {
      edge.id                         = edgeNode.id;
      edge.source                     = m_FindNodeById(edgeNode.source);
      edge.target                     = m_FindNodeById(edgeNode.target);
      edge.attributes["Relationship"] = edgeNode.attributes["Relationship"];
      edge.attributes["Citations"]    = edgeNode.attributes["Citations"];
      edge.attributes["Notes"]        = edgeNode.attributes["Notes"];
      if (DBG) console.log('...updated existing edge',edge.id);
      found = true;
    }
    return edge;
  });
  if (!found) {
    // Not found, add New Node

    // source and target id need to be transformed into nodes
    edgeNode.source = m_FindNodeById(edgeNode.source);
    edgeNode.target = m_FindNodeById(edgeNode.target);

    // Need to add `size` property too
    // REVIEW: This should probably be calculated
    edgeNode.size = 1;

    D3DATA.edges.push(edgeNode);
    UDATA.SetState('D3DATA',D3DATA);
  }
}

/// User has requested an edge be deleted
function m_HandleEdgeDelete ( edgeID ) {
  if (DBG) console.log('m_HandleEdgeDelete',edgeID,'SELECTION.searchLabel',UDATA.State('SELECTION').searchLabel);
  // REVIEW: Should D3DATA always be read from UDATA.State?
  D3DATA.edges = D3DATA.edges.filter( edge => {
    if (edge.id !== edgeID) {
      return edge;
    }
  });
  UDATA.SetState('D3DATA',D3DATA);
  // Also update selection so edges in EdgeEditor will update
  m_HandleNodeSelect( UDATA.State('SELECTION').searchLabel );
  // Hand control back off to nodeselector
  let selection = UDATA.State('SELECTION');
  selection.activeAutoCompleteId = 'nodeSelector';
  UDATA.SetState('SELECTION',selection);
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
