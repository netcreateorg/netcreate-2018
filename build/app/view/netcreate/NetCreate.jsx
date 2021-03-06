/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NetCreate

    The basic React Component structure of the app looks like this:

        NetCreate
        +- NodeSelector
        |  +- NodeDetail
        |  +- AutoComplete
        |  |  +- AutoSuggest
        |  +- EdgeEntry
        |     +- *AutoComplete (for Target Node)*
        +- NetGraph
           +- D3SimpleNetGraph
              +- D3

    `NetCreate` is the root element. It is a wrapper for the key app
    elements `NodeSelector` and `NetGraph`.

    It does not do any data or event handling.  Those are handled individually
    by the respective Components.

  * All state is maintained in `nc-logic.js`
  * It handles events from NodeSelector, EdgeEntry, and NetGraph components
      and passes data and upates across them.

    PROPS  ... (none)
    STATE  ... (none)
    EVENTS ... (none)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
const UNISYS       = require('unisys/client');
const SessionShell = require('unisys/component/SessionShell');

/// DEBUG SWITCHES ////////////////////////////////////////////////////////////
var   DBG          = false;
const PROMPTS      = require('system/util/prompts');
const PR           = PROMPTS.Pad('ACD');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const { Route }    = require('react-router-dom');
const NetGraph     = require('./components/NetGraph');
const Search       = require('./components/Search');
const NodeSelector = require('./components/NodeSelector');
const InfoPanel    = require('./components/InfoPanel');
const NCLOGIC      = require('./nc-logic'); // require to bootstrap data loading
const FILTERLOGIC  = require('./filter-logic'); // handles filtering functions

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ class NetCreate extends UNISYS.Component {
      constructor () {
        super();
        UNISYS.ForceReloadOnNavigation();
        this.state = {
          isConnected: true,
          isLoggedIn: false,
          requireLogin: this.AppState('TEMPLATE').requireLogin,
          disconnectMsg: ''
        };
        this.OnDOMReady(()=>{
          if (DBG) console.log(PR,'OnDOMReady');
        });
        this.OnReset(()=>{
          if (DBG) console.log(PR,'OnReset');
        });
        this.OnStart(()=>{
          if (DBG) console.log(PR,'OnStart');
        });
        this.OnAppReady(()=>{
          if (DBG) console.log(PR,'OnAppReady');
        });
        this.OnRun(()=>{
          if (DBG) console.log(PR,'OnRun');
        });
        this.OnDisconnect((e) => {
          if (DBG) console.log(PR,'OnDisconnect');
          // This is now handled by the UDATA "DISCONNECT" message.
          // so that we can show a message explaining the cause of disconnect.
          // this.setState({ isConnected: false });
        });
        this.onStateChange_SESSION = this.onStateChange_SESSION.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);

        this.OnAppStateChange('SESSION', this.onStateChange_SESSION);

        const UDATA = UNISYS.NewDataLink(this);
        UDATA.HandleMessage("DISCONNECT", this.onDisconnect);
      }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ SESSION is called by SessionShell when the ID changes
      Show or hide netgraph depending on template settings.
  /*/ onStateChange_SESSION( decoded ) {
        this.setState({ isLoggedIn: decoded.isValid });
      }

      onDisconnect(e) {
        const time = new Date().toLocaleTimeString();
        this.setState({
          isConnected: false,
          disconnectMsg: `${e.detail.message} ${time}`
        });
      }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is the root component, so this fires after all subcomponents have
      been fully rendered by render().
  /*/ componentDidMount () {
        // Init dragger
        let dragger = document.getElementById('dragger');
        dragger.onmousedown = this.handleMouseDown;
      }

      componentWillUnmount() {
        this.AppStateChangeOff('SESSION',this.onStateChange_SESSION);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Define the component structure of the web application
  /*/ render() {
    const { isLoggedIn, disconnectMsg } = this.state;
        let hideGraph = false;
        if (this.state.requireLogin && !isLoggedIn) hideGraph = true;
        return (
          <div>
            <div hidden={this.state.isConnected} style={{ width:'100%',height:'38px',position:'fixed',backgroundColor:'rgba(256,0,0,0.5',display:'flex',flexDirection:'column',justifyContent:'space-evenly',alignItems:'center',zIndex:'3000'}}>
              <div style={{color:'#fff',width:'100%',textAlign:'center'}}>
                <b>{disconnectMsg}!</b> Your changes will not be saved!  Please report "{disconnectMsg}" to your administrator to restart the graph.
              </div>
            </div>
            <Route path='/edit/:token' exact={true} component={SessionShell}/>
            <Route path='/edit' exact={true} component={SessionShell}/>
            <Route path='/' exact={true} component={SessionShell}/>
            <div hidden={hideGraph} style={{display:'flex', flexFlow:'row nowrap',
                width:'100%', height:'100vh',overflow:'hidden'}}>
              <div id="left" style={{backgroundColor:'#EEE',flex:'1 1 25%',maxWidth:'400px',padding:'10px',overflow:'scroll',marginTop:'38px'}}>
                <div style={{display:'flex',flexFlow:'column nowrap'}}>
                  <Search/>
                  <NodeSelector/>
                </div>
              </div>
              <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 60%',marginTop:'38px'}}>
                <InfoPanel/>
                <NetGraph/>
                <div style={{fontSize:'10px',position:'fixed',left:'0px',bottom:'0px',right:'0px',zIndex:'1500',color:'#aaa',backgroundColor:'#eee',padding:'5px 10px'}}>Please contact Professor
                Kalani Craig, Institute for Digital Arts & Humanities at
                (812) 856-5721 (BH) or
                craigkl@indiana.edu with questions or concerns and/or to
                request information contained on this website in an accessible
                format.</div>
              </div>
            </div>
          </div>
        ); // end return
      } // end render()
    } // end class NetCreate

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// used in init.jsx to set module scope early
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetCreate.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetCreate
