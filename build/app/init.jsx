const ReactDOM      = require('react-dom');
const React         = require('react');
const HashRouter = require('react-router-dom').HashRouter;

const AppContainer  = require('component/AppContainer');

const UNISYS        = require('system/unisys');
const DATASTORE     = require('system/datastore');

const SETTINGS      = require('settings');

console.group('init.jsx module comparison');
	console.log('ReactDOM',     ReactDOM);
	console.log('UNISYS',       UNISYS);
	console.log('HashRouter',   HashRouter);
	console.log('AppContainer', AppContainer);
console.groupEnd();

console.log('> init.jsx loaded');

// test initialization; this probably won't actually be used like this.
UNISYS.Initialize();
DATASTORE.Initialize();

const APP_CONTAINER = '#app-container';

// initialize AppContainer, which will load view/AppDefault to set up routing
document.addEventListener('DOMContentLoaded', () => {
	console.log('init.jsx initializing App into', APP_CONTAINER);
	ReactDOM.render((
		<HashRouter hashType="noslash">
			<AppContainer />
		</HashRouter>
		), document.querySelector( APP_CONTAINER ));
});
