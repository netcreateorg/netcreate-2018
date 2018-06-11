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
const ReactDOM    = require('react-dom');
const React       = require('react');
const HashRouter  = require('react-router-dom').HashRouter;

/// REACT COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AppShell    = require('init-appshell');

/// SYSTEM MODULES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// demo: require system modules; this will likely be removed
const SETTINGS    = require('settings');
const UNISYS      = require('system/unisys');
const DATASTORE   = require('system/datastore');

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log('> init.jsx loaded');

/// INITIALIZE WHEN DOM HAS FINISHED LOADING //////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP_CONTAINER = '#app-container';

document.addEventListener('DOMContentLoaded', () => {
  console.log('init.jsx: initializing AppShell into', APP_CONTAINER);
  ReactDOM.render((
    <HashRouter hashType="noslash">
      <AppShell />
    </HashRouter>
    ), document.querySelector( APP_CONTAINER ));
});
/// execution continues in init-appshell.jsx
