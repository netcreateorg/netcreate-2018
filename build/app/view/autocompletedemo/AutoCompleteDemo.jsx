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

/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
const UNISYS       = require('unisys/client');

/// DEBUG SWITCHES ////////////////////////////////////////////////////////////
var   DBG          = false;
const PROMPTS      = require('system/util/prompts');
const PR           = PROMPTS.Pad('ACD');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const NetGraph     = require('./components/NetGraph');
const NodeSelector = require('./components/NodeSelector');
const EdgeList     = require('./components/EdgeList');
const ACD_LOGIC    = require('./autocomplete-logic');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ class AutoCompleteDemo extends UNISYS.Component {
      constructor () {
        super();
        UNISYS.ForceReloadOnNavigation();
        this.OnDOMReady(()=>{
          console.log(PR,'OnDOMReady');
        });
        this.OnReset(()=>{
          console.log(PR,'OnReset');
        });
        this.OnStart(()=>{
          console.log(PR,'OnStart');
        });
        this.OnAppReady(()=>{
          console.log(PR,'OnAppReady');
        });
        this.OnRun(()=>{
          console.log(PR,'OnRun');
        });
      }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is the root component, so this fires after all subcomponents have
      been fully rendered by render().
  /*/ componentDidMount () {
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Define the component structure of the web application
  /*/ render() {
        return (
          <div>
            <div style={{display:'flex', flexFlow:'row nowrap',
                width:'100%', height:'100vh',overflow:'hidden'}}>
              <div id="left" style={{backgroundColor:'#EEE',flex:'1 0 auto',maxWidth:'400px',padding:'10px',overflow:'scroll',marginTop:'56px'}}>
                <div style={{display:'flex',flexFlow:'column nowrap'}}>
                  <NodeSelector/>
                </div>
              </div>
              <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 auto', padding:'10px',marginTop:'56px'}}>
                <EdgeList/>
                <NetGraph/>
              </div>
            </div>
          </div>
        ); // end return
      } // end render()
    } // end class AutoCompleteDemo

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// used in init.jsx to set module scope early
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AutoCompleteDemo.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AutoCompleteDemo
