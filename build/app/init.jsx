import ReactDOM      from 'react-dom';
import React         from 'react';

import AppContainer  from 'component/AppContainer';
import UNISYS        from 'system/unisys';
import DATASTORE     from 'system/datastore';

import SETTINGS      from 'settings';

console.group('init.jsx module comparison');
	console.log('ReactDOM', ReactDOM);
	console.log('UNISYS',   UNISYS);
console.groupEnd();

console.log('> init.jsx loaded');

// test initialization; this probably won't actually be used like this.
UNISYS.Initialize();
DATASTORE.Initialize();

const APP_CONTAINER = '#app-container';

// initialize AppContainer, which will load view/AppDefault to set up routing
document.addEventListener('DOMContentLoaded', () => {
	console.log('init.jsx initializing App into', APP_CONTAINER);
	ReactDOM.render(<AppContainer />, document.querySelector( APP_CONTAINER ));
});
