/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	DATASTORE
	stub for testing module loading

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// const SETTINGS = require('settings');
import SETTINGS from 'settings';

let MOD = { module_name : 'DATASTORE' };
let time = SETTINGS.CurrentTime();
console.log(`> ${MOD.module_name} system module loaded ${time}`);

MOD.Initialize = () => {
	console.log(`${MOD.module_name} initializing`);
	if (SETTINGS('unisys')) console.log('SETTINGS unisys =',SETTINGS('unisys'));
	else (console.log('SETTINGS unisys is undefined'));
};

module.exports = MOD;
