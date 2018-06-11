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
      nodes: // an array of nodes, or a single node
      edges: // an array of edges, or a single edge
    }
    'D3DATA' {
      nodes: // all nodes (not all may be actually changed)
      edges: // all edges (not all may be actuallyachanged)
    }
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.Hook('INITIALIZE',()=>{

  // load data; it will get passed onto
  D3.json("http://localhost:3000/htmldemos/d3forcedemo/data.reducedlinks.json", (error,_data)=>{
    if (error) throw Error(error);
    D3DATA = _data;
    // communicate to everyone that a new D3 INSTANCE has been created
    console.log('ACL: broadcasting',D3DATA);
    // change to use STATE SYSTEM, not messaging system
    // UDATA.Broadcast('DATA_UPDATE', D3DATA );
    UDATA.SetState('D3DATA',D3DATA);
  });

  UDATA.Register('SOURCE_SELECT',(data)=> {

    // print out what this will eventually do
    console.log('SOURCE_SELECT call: received', data );

    console.log('SOURCE_SELECT call: updating SELECTION state');
    // note: we don't want to override SELECTION entirely by overwriting
    // with clickedNode so this TEMPORARY
    UDATA.SetState( 'SELECTION', { nodes:data.clickedNode });
    // this would be implemented by any component that needed
    // to know when global state changes
    // UDATA.OnStateChange('SELECTION', this.globalStateChanged);

    // in the class:
    // globalStateChanged( namespace, obj ) {
         // this is fired when the global state changes
    // }

    m_HandleNodeClick( data );

  }); // REGISTER SOURCE_SELECT



  UDATA.Register('SOURCE_DRAG',function(data) {
    console.log('SOURCE_DRAG',data);
  });
  UDATA.Register('FILTER_SOURCES',function(data) {
    console.log('FILTER_SOURCES',data);
  });
  UDATA.Register('SOURCE_HILITE',function(data) {
    console.log('SOURCE_HILITE',data);
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
/// LOGIC METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HandleNodeClick (data) {
  console.log('m_HandleNodeClick got data',data);

  let id = data.node.id;
  if (id==='') {
    //this.deselectAllNodes()
    return
  }

  // 1. Set the SelectedSourceNode
  UDATA.SetState('SELECTION',{nodes: [data.node]});


  // 2. Mark the selected node
  let color = '#0000DD';
  D3DATA.nodes = D3DATA.nodes.map( node => {
    if (node.id===id) {
      node.selected = color;
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


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
