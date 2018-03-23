/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = require('settings');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MOD     = { module_name : 'DATASTORE' };
let time    = SETTINGS.CurrentTime();
let counter = 0;
console.log(`> ${MOD.module_name} system module loaded ${time}`);



/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Dummy initialize; I probably want to make a class that implements a
/// lifecycle
MOD.Initialize = () => {
  console.log(`${MOD.module_name} initializing`);
  if (SETTINGS('unisys')) console.log('SETTINGS unisys =',SETTINGS('unisys'));
  else (console.log('SETTINGS unisys is undefined'));
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Dummy method
MOD.Increment = () => {
  console.log(`DATA COUNTER ${counter++}`);
};



/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
