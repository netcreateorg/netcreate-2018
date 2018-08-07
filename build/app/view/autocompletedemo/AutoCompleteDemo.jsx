/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    AUTO COMPLETE DEMO

    The basic React Component structure of the app looks like this:

        AutoCompleteDemo
        +- NodeSelector
        |  +- NodeDetail
        |  +- AutoComplete
        |  |  +- AutoSuggest
        |  +- EdgeEntry
        |     +- *AutoComplete (for Target Node)*
        +- NetGraph
           +- D3SimpleNetGraph
              +- D3

    `AutoCompleteDemo` is the root element. It is a wrapper for the key app
    elements `NodeSelector` and `NetGraph`.

    It does not do any data or event handling.  Those are handled individually
    by the respective Components.

  * All state is maintained in `autocomplete-logic.js`
  * It handles events from NodeSelector, EdgeEntry, and NetGraph components
      and passes data and upates across them.

    PROPS  ... (none)
    STATE  ... (none)
    EVENTS ... (none)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUG SWITCHES ////////////////////////////////////////////////////////////
var   DBG          = false;
const PROMPTS      = require('system/util/prompts');
const PR           = PROMPTS.Pad('AutoCompleteDemo');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const ACD_LOGIC    = require('./autocomplete-logic');
const ReactStrap   = require('reactstrap');

/// NEW SIGNLING SYSTEM LIBRARIES /////////////////////////////////////////////
const UNISYS       = require('unisys/client');
var   UDATA        = null; // set in constructor

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ class AutoCompleteDemo extends React.Component {
      constructor () {
        super();
        // UDATA is the interface to unisys messaging and state features
        UDATA = UNISYS.NewDataLink(this);
        /* (1) UNISYS LIFECYCLE INITIALIZATION                        */
        /* must initialize UNISYS before declaring any hook functions */
        /* then call UNISYS.NetworkInitialize() in componentDidMount  */
        UNISYS.SystemInitialize(module.id);
      }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is the root component, so this fires after all subcomponents have
      been fully rendered by render().
  /*/ componentDidMount () {
        /* (2) UNISYS NETWORK INITIALIZATION                            */
        /* now that UI is completely rendered, connect to UNISYS net!   */
        /* see also constructor for UNISYS initialization               */
        UNISYS.NetworkInitialize(() => {
          console.log(PR,'unisys network initialized');
          /* (3) UNISYS LIFECYCLE INITIALIZATION                        */
          /* all program logic should be located in a UNISYS LIFECYCLE  */
          (async () => {
            await UNISYS.EnterApp();  // INITIALIZE, UNISYS_INIT, LOADASSETS
            await UNISYS.SetupRun();  // RESET, CONFIGURE, UNISYS_SYNC, START
          })();
        });
        // NOTE: see unisys-lifecycle.js for more run modes
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Define the component structure of the web application
  /*/ render() {
        return (
          <div>
            <h1>Auto Complete Demo</h1>
            <p>INSTRUCTIONS: Type in the "Nodes" input field to highlight nodes or
          move a node around to see how it's linked to other nodes.</p>
          <p>To Zoom/Pan: Use mousewheel (or two fingers on a trackpad) to zoom in and out.  Drag the background to pan.</p>
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
        ); // end return
      } // end render()
    } // end class AutoCompleteDemo

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo
