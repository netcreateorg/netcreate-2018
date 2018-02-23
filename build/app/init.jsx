const ReactDOM    = require('react-dom');
const React       = require('react');
const HashRouter  = require('react-router-dom').HashRouter;

const AppShell    = require('init-appshell');

const UNISYS      = require('system/unisys');
const DATASTORE   = require('system/datastore');

const SETTINGS    = require('settings');

console.log('> init.jsx loaded');

// test initialization; this probably won't actually be used like this.
UNISYS.Initialize();
DATASTORE.Initialize();

const APP_CONTAINER = '#app-container';

// initialize AppShell, which will load view/AppDefault to set up routing
document.addEventListener('DOMContentLoaded', () => {
	console.log('init.jsx initializing App into', APP_CONTAINER);
	ReactDOM.render((
		<HashRouter hashType="noslash">
			<AppShell />
		</HashRouter>
		), document.querySelector( APP_CONTAINER ));
});
