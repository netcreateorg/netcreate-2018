if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    init.jsx
    system startup, loaded by app/assets/index.html at end of body.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
require("babel-polyfill"); // enables regenerators for async/await

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React         = require('react');
const ReactDOM      = require('react-dom');
const HashRouter    = require('react-router-dom').HashRouter;

/// SYSTEM MODULES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// demo: require system modules; this will likely be removed
const UNISYS        = require('unisys/client');
const AppShell      = require('init-appshell');

/// UNISYS LIFECYCLE LOADER ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ When the DOM is loaded, initialize UNISYS
/*/ document.addEventListener('DOMContentLoaded', () => {
      m_SetLifecycleScope();
      // lifecycle
      (async () => {
        await UNISYS.EnterNet();  // UNISYS socket connection (that is all)
        await UNISYS.EnterApp();  // INITIALIZE, UNISYS_INIT, LOADASSETS
        await m_RenderApp();      // REACT initial view rendering
        await UNISYS.SetupRun();  // RESET, CONFIGURE, UNISYS_READY, START
      })();
    });

/// LIFECYCLE HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ helper to infer view module scope before module is routed lated (!)
/*/ function m_SetLifecycleScope() {
      // set scope for UNISYS execution
      let routes = AppShell.Routes;
      let loc = '/'+window.location.hash.substring(1);
      let matches = routes.filter((route)=>{return route.path===loc});
      let component = matches[0].component;
      if (component.UMOD===undefined) console.warn(`WARNING: root view '${loc}' has no UMOD property, so can not set UNISYS scope`);
      let modscope = component.UMOD || '<undefined>/init.jsx';
      UNISYS.SetScope(modscope);
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Wraps ReactDOM.render() in a Promise. Execution continues in <AppShell>
    and the routed view in AppShell.Routes
/*/ function m_RenderApp() {
      return new Promise(( resolve, reject ) => {
        try {
          ReactDOM.render((
            <HashRouter hashType="noslash">
              <AppShell />
            </HashRouter>
            ), document.querySelector( '#app-container' ), resolve)
        } catch (e) {
          console.error('m_RenderApp() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
        }
      }); // promise
    }
