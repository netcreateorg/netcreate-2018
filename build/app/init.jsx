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
const ReactDOM      = require('react-dom');
const React         = require('react');
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
      ReactDOM.render((
        <HashRouter hashType="noslash">
          <AppShell />
        </HashRouter>
        ),
        document.querySelector( '#app-container' ),
        ()=>{
          UNISYS.NetworkInitialize(() => {
            (async () => {
              await UNISYS.EnterApp();  // INITIALIZE, UNISYS_INIT, REACT_INIT, LOADASSETS
              await UNISYS.SetupRun();  // RESET, CONFIGURE, UNISYS_READY, START
            })();
          });
        });
    });

