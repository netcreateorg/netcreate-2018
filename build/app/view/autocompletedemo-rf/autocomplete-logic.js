/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG      = true;

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
      nodes:               // an array of selected nodes for editing
      edges:               // an array of edge objects for editing
      searchLabel:         // a string representing what the user has typed
      suggestedNodeLabels: // an array of node labels suggestions that match
                              the search string
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
      console.error('AutoComplete-logic.SOURCE_SELECT received empty nodeLabels in data',data);
    }
  }); // REGISTER SOURCE_SELECT



  UDATA.Register('SOURCE_DRAG',function(data) {
    console.log('SOURCE_DRAG',data);
  });
  UDATA.Register('FILTER_SOURCES',function(data) {
    console.log('FILTER_SOURCES',data);
  });
  /// `data` = { searchString: "" }
  UDATA.Register('SOURCE_SEARCH',function(data) {
    console.log('SOURCE_SEARCH',data);
    m_HandleSourceSearch( data.searchString );
  });
  UDATA.Register('SOURCE_HILITE',function(data) {
    console.log('SOURCE_HILITE',data);
    m_HandleSourceHilite( data.nodeLabel );
  });
  UDATA.Register('SOURCE_UPDATE',function(data) {
    console.log('SOURCE_UPDATE',data);
  });

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
    console.log('SELECTION state: contains',state );
    console.log('SELECTION state: update data structure with new state');
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


/// NODE SELECTION METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_DeselectAllNodes () {
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


/// LOGIC METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HandleNodeSelect (nodeLabel) {
  console.log('m_HandleNodeSelect got data',node);

  let node = m_GetNodeByLabel( nodeLabel );

  let id = node.id;

  // 0. No node selected, deselect all
  if (id==='') {
    m_DeselectAllNodes();
    return;
  }

  // 1. Set the SelectedSourceNode
  let selection = UDATA.State('SELECTION');
  selection.nodes = [node];
  selection.searchLabel = node.label;
  UDATA.SetState('SELECTION',selection);
  // this would be implemented by any component that needed
  // to know when global state changes
  // UDATA.OnStateChange('SELECTION', this.globalStateChanged);

  // 2. Mark the selected node
  let color = '#0000DD';
  m_MarkNodeById( id, color );

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
  if (searchString==='') {
    m_DeselectAllNodes()
    return
  }
  D3DATA.nodes = D3DATA.nodes.map( node => {
    // search for matches (partial matches are included)
    if (m_AppearsIn(searchString, node.label)) {
      node.selected = SOURCE_COLOR;
    } else {
      node.selected = DESELECTED_COLOR;
// TODO this needs to be implemented
    //   // intent is only to set selected node color if the node doesn't already have one
    //   node.selected = this.getSelectedNodeColor( node, color )
    // } else {
    //   node.selected = this.getDeselectedNodeColor( node, color )
    }
    return node
  })
  UDATA.SetState('D3DATA',D3DATA);
}


/// User has moused over (or keyboard-arrowed-over) an item in the suggestion list
function m_HandleSourceHilite (nodeLabel) {
  if (!nodeLabel) return;  // ignore hilite if nothing was set
  m_DeselectAllNodes();
  m_MarkNodeByLabel( nodeLabel, SOURCE_COLOR );
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
