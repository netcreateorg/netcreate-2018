/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    *EVENTS: D3 Graph Updates*

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

const DBG      = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS   = require('system/unisys');
const D3       = require('d3');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD        = UNISYS.NewModule(module.id);
var UDATA      = UNISYS.NewDataLink(MOD);

/// APP STATE/DATA STRUCTURES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var D3DATA         = null;
var SELECTION      = {};
/*/ STATE DESIGN of NAMESPACES
    'SELECTION' {
      activeAutoCompleteId:// 'node-xx' or 'edge-source-xx' or 'edge-target-xx'
                              where xx = the id of the node/edge of the
                              AutoComplete field that has the current focus.
                              This is used to keep track of the currently
                              active AutoComplete field, disabling the inactive
                              fields and providing updates as necessary.
      nodes:               // an array of current selected nodes for editing
                           // this is the node the user clicked on in the
                           // graph or selected from the suggestions list
      edges:               // an array of edge objects for editing
// REVIEW: Should this be renamed "selectedEdges" to distinguish from D3DATA.edges
      searchLabel:         // a string representing what the user has typed
      suggestedNodeLabels: // an array of node labels suggestions that match
                              the search string
      hilitedNode:         // a node object the user has hilited in the
                              suggestion list.
    }
    'D3DATA' {
      nodes: // all nodes (not all may be actually changed)
      edges: // all edges (not all may be actuallyachanged)
    }
/*/


/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DESELECTED_COLOR = '';
const SOURCE_COLOR     = '#0000DD'
const TARGET_COLOR     = '#FF0000'


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.Hook('INITIALIZE',()=>{

  // load data; it will get passed onto
  D3.json("http://localhost:3000/htmldemos/d3forcedemo/data.reducedlinks.json", (error,_data)=>{
    if (error) throw Error(error);
    D3DATA = _data;
    // communicate to everyone that a new D3 INSTANCE has been created
    if (DBG) console.log('ACL: broadcasting',D3DATA);
    // change to use STATE SYSTEM, not messaging system
    // UDATA.Broadcast('DATA_UPDATE', D3DATA );
    UDATA.SetState('D3DATA',D3DATA);
  });

  /// `data` = { nodeLabels: [] }
  ///
  ///        Called by:
  ///          AutoComplete.onSuggestionSelected
  ///          D3SimpleNetGraph._UpdateGraph click handler
  ///
  ///         We use nodeLabels suggestions sent from AutoComplete do not
  ///         have access to the source node objects.
  ///
  UDATA.Register('SOURCE_SELECT',(data)=> {
    if (DBG) console.log('SOURCE_SELECT call: received', data );
    if (data.nodeLabels.length>0) {
      m_HandleNodeSelect( data.nodeLabels[0] );
    } else {
      m_HandleNodeSelect();
    }
  }); // REGISTER SOURCE_SELECT



  UDATA.Register('SOURCE_DRAG',function(data) {
    if (DBG) console.log('SOURCE_DRAG',data);
  });
  UDATA.Register('FILTER_SOURCES',function(data) {
    if (DBG) console.log('FILTER_SOURCES',data);
  });
  /// `data` = { searchString: "" }
  UDATA.Register('SOURCE_SEARCH',function(data) {
    if (DBG) console.log('SOURCE_SEARCH',data);
    m_HandleSourceSearch( data.searchString );
  });
  /// `data` = { nodeLabel: string, color: string }
  UDATA.Register('SOURCE_HILITE',function(data) {
    if (DBG) console.log('SOURCE_HILITE',data);
    m_HandleSourceHilite( data.nodeLabel );
  });
  /// `data` = { node: node }
  UDATA.Register('SOURCE_UPDATE',function(data) {
    if (DBG) console.log('SOURCE_UPDATE',data);
    m_HandleSourceUpdate( data.node );
  });
  /// `data` = { edge: sourceNode }
  UDATA.Register('EDGE_UPDATE',function(data) {
    if (DBG) console.log('EDGE_UPDATE',data);
    m_HandleEdgeUpdate( data.edge );
  });
  /// `data` = { edgeID: string }
  UDATA.Register('EDGE_DELETE',function(data) {
    if (DBG) console.log('EDGE_DELETE',data);
    m_HandleEdgeDelete( data.edgeID );
  })
  /// AutoComplete components register here to be
  /// the active component.
  ///
  /// `data` = { id: id, searchString: "" }
  ///          `searchString` needs to be passed so when we
  ///          switch components, we know what the new value is
  ///
  UDATA.Register('AUTOCOMPLETE_SELECT',function(data) {
    if (DBG) console.log('AUTOCOMPLETE_SELECT',data);
    let selection = UDATA.State('SELECTION');
    selection.activeAutoCompleteId = data.id;
    // Only set searchLabel if it was passed
    if (data.searchString!==undefined) {
      selection.searchLabel = data.searchString;
    }
    UDATA.SetState('SELECTION',selection);
  })

  // console.log('defining SET_D3_INSTANCE');
  // UDATA.Register('SET_D3_INSTANCE',(data)=>{
  //   D3DATA = data.d3NetGraph;
  //   console.log('SET_D3_INSTANCE received',D3DATA);
  // }); // D3_INSTANCE

});

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.Hook('START',()=>{

  // REGISTER STATE MANAGEMENT
  UDATA.OnStateChange('SELECTION',(state) => {
    if (DBG) console.log('SELECTION state: contains',state );
    if (DBG) console.log('SELECTION state: update data structure with new state');
    // copy AutoCompleteDemo node state stuff here
  });

}); // START


/* WIP */


/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function m_EscapeRegexCharacters (str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Retrieve a list of suggestions from the lexicon where `value` appears
function m_GetSuggestions (value, lexicon) {
  const escapedValue = m_EscapeRegexCharacters(value.trim());
  if (escapedValue === '') { return []; }
  // const regex = new RegExp('^' + escapedValue, 'i'); // match start of string only
  const regex = new RegExp(escapedValue, 'i');
  const suggestions = lexicon.filter(phrase => regex.test(phrase));
  if (suggestions.length === 0) {
    return [
      { isAddNew: true }
    ];
  }
  if (DBG) console.log('AutoComplete-Logic.m_GetSuggestions found',suggestions);
  return suggestions;
}

function m_AppearsIn (searchValue, targetString) {
  if (typeof searchValue !== 'string') { return false; }
  const escapedLabel = m_EscapeRegexCharacters(searchValue.trim());
  if (escapedLabel === '') { return false; }
  const regex = new RegExp(escapedLabel, 'i'); // case insensitive
  return regex.test(targetString);
}

/// Returns the first node that matches the label
function m_GetNodeByLabel (label) {
  let found = D3DATA.nodes.filter( node => node.label===label );
  if (found.length>0) {
    return found[0];
  } else {
    return undefined;
  }
}

/// Returns the first node that matches the id
function m_GetNodeById (id) {
  let found = D3DATA.nodes.filter( node => node.id===id );
  if (found.length>0) {
    return found[0];
  } else {
    return undefined;
  }
}



/// NODE MARKING METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UnMarkAllNodes () {
  /*STYLE*/// is the intent of this to ensure node.selected has a value of some kind? is it necessary at all?
//  for (let node of this.state.data.nodes) { node.selected = this.getDeselectedNodeColor( node ) }
  /*STYLE*///
  let color = DESELECTED_COLOR
  D3DATA.nodes = D3DATA.nodes.map( node => {
    node.selected = DESELECTED_COLOR
    return node
  })
  UDATA.SetState('D3DATA',D3DATA);
}

/// Sets the `node.selected` property to `color` so it is hilited on graph
function m_MarkNodeById (id, color) {
  D3DATA.nodes = D3DATA.nodes.map( node => {
    if (node.id===id) {
      node.selected = SOURCE_COLOR;
// TODO this needs to be implemented
    //   node.selected = this.getSelectedNodeColor( node, color )
    // } else {
    //   node.selected = this.getDeselectedNodeColor( node, color )
    } else {
      node.selected = DESELECTED_COLOR;
    }
    return node
  })
  // use state system instead of messaging system
  // UDATA.Broadcast( 'DATA_UPDATE', D3DATA );
  UDATA.SetState('D3DATA',D3DATA);
}

/// Sets the `node.selected` property to `color` so it is hilited on graph
function m_MarkNodeByLabel (label, color) {
  D3DATA.nodes = D3DATA.nodes.map( node => {
    if (node.label===label) {
      node.selected = color;
// TODO this needs to be implemented
    //   node.selected = this.getSelectedNodeColor( node, color )
    // } else {
    //   node.selected = this.getDeselectedNodeColor( node, color )
    }
    return node
  })
  // use state system instead of messaging system
  // UDATA.Broadcast( 'DATA_UPDATE', D3DATA );
  UDATA.SetState('D3DATA',D3DATA);
}

function m_MarkNodesThatMatch (searchString, color) {
  if (searchString==='') {
    m_UnMarkAllNodes();
    return;
  }
  D3DATA.nodes = D3DATA.nodes.map( node => {
    // search for matches (partial matches are included)
    if (m_AppearsIn(searchString, node.label)) {
      node.selected = color;
    } else {
      node.selected = DESELECTED_COLOR;
// TODO this needs to be implemented
    //   // intent is only to set selected node color if the node doesn't already have one
    //   node.selected = this.getSelectedNodeColor( node, color )
    // } else {
    //   node.selected = this.getDeselectedNodeColor( node, color )
    }
    return node;
  })
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
function m_HandleNodeSelect (nodeLabel) {
  if (DBG) console.log('autocomplete-logic.m_HandleNodeSelect got data',nodeLabel);

  let node = m_GetNodeByLabel( nodeLabel );
  let selection = UDATA.State('SELECTION');

  if (node===undefined) {
    // No node selected, deselect all

    m_UnMarkAllNodes();
    selection.nodes = [];
    selection.edges = [];
    selection.searchLabel = '';

    // Make NodeSelector's AutoComplete the default
    selection.activeAutoCompleteId = 'nodeSelector';

  } else {
    // Select Node

    // 1. Set the SelectedSourceNode
    selection.nodes = [node];
    selection.searchLabel = node.label;

    // 2. Find the related edges
    //    `edges` needs to always be defined as an array or React rendering will break
    let edges = [];
    edges = edges.concat( D3DATA.edges.filter( edge => edge.source.label===nodeLabel || edge.target.label===nodeLabel) );
    selection.edges = edges;

    // 3. Mark the selected node
    let color = '#0000DD';
    m_MarkNodeById( node.id, color );
  }

  // 4. Set the state
  UDATA.SetState('SELECTION',selection);
  // this would be implemented by any component that needed
  // to know when global state changes
  // UDATA.OnStateChange('SELECTION', this.globalStateChanged);

}


/// User has input a new search string
function m_HandleSourceSearch (searchString) {
  // 1. Construct the suggestions list
  let data = UDATA.State('D3DATA');
  let lexicon = data.nodes.map(function(d){return d.label});
  let suggestions = m_GetSuggestions(searchString, lexicon);
  let selection = UDATA.State('SELECTION');
  selection.suggestedNodeLabels = suggestions;

  // 2. Also set the current search string.
  selection.searchLabel = searchString;

  // 3. And clear the selected nodes
  selection.nodes = undefined;

  // 4. Set the SELECTION state.
  //    This will cause any listeners to update.
  UDATA.SetState('SELECTION',selection);

  // 5. Mark the selected nodes
  m_MarkNodesThatMatch( searchString, SOURCE_COLOR);

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
  let hilitedNode = m_GetNodeByLabel(nodeLabel);
  UDATA.SetState('SELECTION',{ hilitedNode: hilitedNode });
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
  UDATA.SetState('SELECTION',{searchLabel: ''});
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
      edge.source                     = m_GetNodeById(edgeNode.source);
      edge.target                     = m_GetNodeById(edgeNode.target);
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
    edgeNode.source = m_GetNodeById(edgeNode.source);
    edgeNode.target = m_GetNodeById(edgeNode.target);

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
