/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	DATASTORE
	stub for testing module loading

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// const SETTINGS = require('settings');
import SETTINGS from 'settings';

let MOD = { module_name : 'DATASTORE' };
let time = SETTINGS.CurrentTime();
let counter = 0;
console.log(`> ${MOD.module_name} system module loaded ${time}`);

MOD.Initialize = () => {
	console.log(`${MOD.module_name} initializing`);
	if (SETTINGS('unisys')) console.log('SETTINGS unisys =',SETTINGS('unisys'));
	else (console.log('SETTINGS unisys is undefined'));
};
MOD.Increment = () => {
	console.log(`DATA COUNTER ${counter++}`);
};

module.exports = MOD;
