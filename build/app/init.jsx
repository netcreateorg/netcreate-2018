if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    init.jsx
    system startup, loaded by app/assets/index.html at end of body.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
require("babel-polyfill"); // enables regenerators for async/await

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React           = require('react');
const ReactDOM        = require('react-dom');
const { HashRouter }  = require('react-router-dom');

/// SYSTEM MODULES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// demo: require system modules; this will likely be removed
const UNISYS          = require('unisys/client');
const AppShell        = require('init-appshell');

/// UNISYS LIFECYCLE LOADER ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ When the DOM is loaded, initialize UNISYS
/*/ document.addEventListener('DOMContentLoaded', () => {
      console.group('init.jsx bootstrap');
      console.log('%cINIT %cDOMContentLoaded. Starting UNISYS Lifecycle!','color:blue','color:auto');
      m_SetLifecycleScope();
      (async () => {
        await UNISYS.JoinNet();   // UNISYS socket connection (that is all)
        await UNISYS.EnterApp();  // TEST_CONF, INITIALIZE, LOADASSETS, CONFIGURE
        await m_RenderApp();      // compose React view
        await UNISYS.SetupDOM();  // DOM_READY
        await UNISYS.SetupRun();  // RESET, START, APP_READY, RUN
        console.log('%cINIT %cUNISYS Lifecycle Initialization Complete','color:blue','color:auto');
        console.groupEnd();
      })();
    });

/// LIFECYCLE HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ helper to infer view module scope before module is routed lated (!)
/*/ function m_SetLifecycleScope() {
      // set scope for UNISYS execution
      let routes = AppShell.Routes;
      // check #, and remove any trailing parameters in slashes
      // we want the first one
      let hashbits = window.location.hash.split('/');
      let hash = hashbits[0];
      let loc = '/'+hash.substring(1);
      let matches = routes.filter((route)=>{return route.path===loc});
      if (matches.length) {
        if (DBG) console.log(`m_SetLifecycleScope() matched scope ${hash}`);
        let component = matches[0].component;
        if (component.UMOD===undefined) console.warn(`WARNING: root view '${loc}' has no UMOD property, so can not set UNISYS scope`);
        let modscope = component.UMOD || '<undefined>/init.jsx';
        UNISYS.SetScope(modscope);
      } else {
        console.warn(`m_SetLifecycleScope() could not match scope ${loc}`);
      }
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Wraps ReactDOM.render() in a Promise. Execution continues in <AppShell>
    and the routed view in AppShell.Routes
/*/ function m_RenderApp() {
      if (DBG) console.log('%cINIT %cReactDOM.render() begin','color:blue','color:auto');
      return new Promise(( resolve, reject ) => {
        try {
          ReactDOM.render((
            <HashRouter hashType="slash">
              <AppShell />
            </HashRouter>
            ), document.querySelector( '#app-container' ), ()=>{
              console.log('%cINIT %cReactDOM.render() complete','color:blue','color:auto');
              resolve();
            })
        } catch (e) {
          console.error('m_RenderApp() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
        }
      }); // promise
    }
