if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DevDBLogic is the companion module that implements the console CLI for
    manipulating the database on the server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = require('settings');
const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');
const SESSION = require('unisys/common-session');
const JSCLI = require('system/util/jscli');

/// DEBUG SUPPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('system/util/prompts');
const DBG = { handler: false };

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// module 1
const PR = PROMPTS.Pad('DevDBLogic');
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// COMPATIBILITY MODES  //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('INITIALIZE', function () {
  console.log('*** INITIALIZE ***');
});

/// APP_READY MESSAGE REGISTRATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/ MOD.Hook('APP_READY', function (info) {
  console.log('*** APP_READY ***');
  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      reject(Error('UNISYS REGISTER TIMEOUT'));
    }, 5000);
    UNISYS.RegisterMessagesPromise().then(data => {
      clearTimeout(timeout);
      console.log('RegisterMessagesPromise() registered handlers with server', data);
      console.log('This SocketUADDR is', UNISYS.SocketUADDR());
      resolve();
    });
  });
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('START', function () {
  console.log('*** INITIALIZE ***');
});

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
