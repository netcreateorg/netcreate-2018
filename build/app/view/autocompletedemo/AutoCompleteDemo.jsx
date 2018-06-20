/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\


    Auto Complete Demo
    ==================

    The basic structure of the app looks like this:

        AutoCompleteDemo
        |
        +- NodeSelector
        |  |
        |  +- NodeDetail
        |  |
        |  +- AutoComplete
        |  |  |
        |  |  +- AutoSuggest
        |  |
        |  +- EdgeEntry
        |     |
        |     +- *AutoComplete (for Target Node)*
        |
        +- NetGraph
           |
           +- D3SimpleNetGraph
              |
              +- D3



    # AutoCompleteDemo.jsx

    `AutoCompleteDemo.jsx` is the root element.  It is essentially a dumb wrapper
    for the key app elements; NodeSelector and NetGraph.

    It does not do any data or event handling.  Those are handled individually
    by the repsective Components.

    *   All state is maintained in autocomplete-logic.jsx.
    *   It handles events from NodeSelector, EdgeEntry, and NetGraph components
        and passes data and upates across them.


    *PROPS*

                            (none)


    *STATE*

                            (none)


    *EVENTS*

                            (none)



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const ACD_LOGIC    = require('./autocomplete-logic');
const ReactStrap   = require('reactstrap');

/// NEW SIGNLING SYSTEM LIBRARIES /////////////////////////////////////////////
const UNISYS       = require('system/unisys');
var   UDATA        = null; // set in constructor
      // start UNISYS
      UNISYS.SystemInitialize( module.id );


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AutoCompleteDemo extends React.Component {
  constructor () {
    super()
    this.state = {
      data:                    {},    // nodes and edges data object
      selectedSourceNode:      {},
      selectedTargetNode:      {},
    }

    /*NEWCODE*/
    console.group(module.id);
    UDATA = UNISYS.NewDataLink( this );
    UDATA.Call('ACD_CONSTRUCT');
    console.groupEnd();
    /*NEWCODE END*/

  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// REACT LIFECYCLE
  ///
  componentDidMount () {
    // kickoff initialization stage by stage
    (async () => {
      await UNISYS.EnterApp();
      await UNISYS.SetupRun();
    })();
  }

  render() {
    return (
      <div>
        <h1>Auto Complete Demo</h1>
        <p>This demonstrates how a d3 force simulation, a node selection input
        field, and a node viewer might be encapsulated into react components
        and pass data back and forth to each other.</p>
        <p>INSTRUCTIONS: Type in the "Nodes" input field to highlight nodes or
        a node around to see how it's linked to other nodes.</p>
        <div style={{display:'flex', flexFlow:'row nowrap',
             width:'100%', height:'100%'}}>
          <div id="left" style={{backgroundColor:'#E0ffff',flex:'1 0 auto',maxWidth:'300px',padding:'10px'}}>
            <div style={{display:'flex', flexFlow:'column nowrap'}}>
              <div style={{flexGrow:1}}>
                <h3>Nodes (RF)</h3>
              </div>
              <div>
                <NodeSelector/>
              </div>
            </div>
          </div>
          <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 auto', padding:'10px'}}>
            <NetGraph/>
          </div>
          <div id="right" style={{backgroundColor:'#ffffE0', flex:'1 0 auto', padding:'10px'}}>
            <h3>Edges</h3>
          </div>
        </div>
      </div>
    )
  }
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo
