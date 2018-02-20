import ReactDOM  from 'react-dom';
import React     from 'react';
import App       from 'gui/App';

import UNISYS    from 'sys/unisys';
import DATASTORE from 'sys/datastore';

import SETTINGS  from 'settings';

console.group('init.jsx module comparison');
	console.log('ReactDOM', ReactDOM);
	console.log('UNISYS',   UNISYS);
console.groupEnd();

console.log('> init.jsx loaded');

UNISYS.Initialize();
DATASTORE.Initialize();

document.addEventListener('DOMContentLoaded', () => {
	console.log('init.jsx initializing App into #system-shell');
	ReactDOM.render(<App />, document.querySelector('#system-shell'));
});
