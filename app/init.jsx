/* eslint-disable no-debugger */
if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    init.jsx
    system startup, loaded by app/assets/index.html at end of body.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files
require('babel-polyfill'); // enables regenerators for async/await

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactDOM = require('react-dom');

/// SYSTEM MODULES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// demo: require system modules; this will likely be removed
const SETTINGS = require('settings');
const UNISYS = require('unisys/client');
const AppShell = require('init-appshell');

/// UNISYS LIFECYCLE LOADER ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// When the DOM is loaded, initialize UNISYS
document.addEventListener('DOMContentLoaded', () => {
  console.group('init.jsx bootstrap');
  console.log(
    '%cINIT %cDOMContentLoaded. Starting UNISYS Lifecycle!',
    'color:blue',
    'color:auto'
  );
  m_SetLifecycleScope();
  (async () => {
    await UNISYS.JoinNet(); // UNISYS socket connection (that is all)
    await UNISYS.EnterApp(); // TEST_CONF, INITIALIZE, LOADASSETS, CONFIGURE
    await m_RenderApp(); // compose React view
    await UNISYS.SetupDOM(); // DOM_READY
    await UNISYS.SetupRun(); // RESET, START, APP_READY, RUN
    console.log(
      '%cINIT %cUNISYS Lifecycle Initialization Complete',
      'color:blue',
      'color:auto'
    );
    console.groupEnd();
  })();
});

/// UNISYS LIFECYCLE CLOSE EVENT //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this custom event accesses post-run lifecycles defined for 'DOMContentLoaded'
 *  `event` is originated by `comment-netmessage-class.GlobalOfflineMode
 *  with a custom event message coming from client-network.m_ResetHearbeatTimer
 *  This is so we can display an error to the user explaining the disconnect
 */
document.addEventListener('UNISYSDisconnect', event => {
  console.log(
    '%cDISCONNECT %cUNISYSDisconnect. Closing UNISYS Lifecycle!',
    'color:blue',
    'color:auto'
  );
  // This call will fail if the server is disconnected.
  UNISYS.Log('Server disconnected with error', event);
  // hack a local module for now
  let UDATA = UNISYS.NewDataLink({});
  UDATA.LocalCall('DISCONNECT', event);
  (async () => {
    await UNISYS.ServerDisconnect(); // UNISYS has dropped server
    console.log(
      '%cDISCONNECT %cUNISYSDisconnect Complete',
      'color:blue',
      'color:auto'
    );
  })();
});

/// LIFECYCLE HELPERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** DEPRECATED? This may no longer actually be needed as it
 *  helper to infer view module scope before module is routed lated (!)
 *  scope is really the 'path' of the current route (e.g. #)
 */
function m_SetLifecycleScope() {
  // set scope for UNISYS execution
  const url = window.location.href;
  const { scope } = SETTINGS.GetRouteInfoFromURL(url);
  if (scope) {
    if (DBG) console.log(`Lifecycle Module Scope is ${scope}`);
    UNISYS.SetScope(scope);
  } else {
    console.warn(`m_SetLifecycleScope() could not match scope ${url}`);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Wraps ReactDOM.render() in a Promise. Execution continues in <AppShell>
 *  and the routed view in AppShell.Routes
 */
function m_RenderApp() {
  if (DBG)
    console.log('%cINIT %cReactDOM.render() begin', 'color:blue', 'color:auto');
  return new Promise((resolve, reject) => {
    try {
      ReactDOM.render(<AppShell />, document.querySelector('#app-container'), () => {
        console.log(
          '%cINIT %cReactDOM.render() complete',
          'color:blue',
          'color:auto'
        );
        resolve();
      });
    } catch (e) {
      console.error(
        'm_RenderApp() Lifecycle Error. Check phase execution order effect on data validity.\n',
        e
      );
      debugger;
    }
  }); // promise
}
