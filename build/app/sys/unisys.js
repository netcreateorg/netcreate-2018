/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	UNISYS
	stub for testing module loading

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

// const SETTINGS = require('settings');
import SETTINGS from 'settings';

let MOD = { module_name : 'UNISYS' };
let time = SETTINGS.CurrentTime();
console.log(`> ${MOD.module_name} system module loaded ${time}`);

MOD.Initialize = () => {
	console.log(`${MOD.module_name} initializing`);
	SETTINGS('unisys','loaded');
};

module.exports = MOD;
