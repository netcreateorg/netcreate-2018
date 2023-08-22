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

/// DEBUG SUPPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = { handler: false };
const PROMPTS = require('system/util/prompts');
const JSCLI = require('system/util/jscli');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// module 1
const PR = PROMPTS.Pad('DevDBLogic');
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// COMPATIBILITY MODES  //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Provide Compatibility with DevUnisys instances
/*/ MOD.Hook('INITIALIZE', function () {
  console.log('*** INITIALIZE ***');
  // without NET_SEND_TEST:
  // fail netCallHandlr, netData, netDataAdd, netDataMulti, netDataReturn
  // fail netSendHndlr

  // spy on NET_SEND_TEST
  // does not affect tests
  UDATA.HandleMessage('NET_SEND_TEST', function (data) {
    console.log(PR, 'snooping NET_SEND_TEST data', JSON.stringify(data));
  });
  // add NET_CALL_TEST handler
  // netData passes, but not specific data tests
  UDATA.HandleMessage('NET_CALL_TEST', function (data) {
    console.log(PR, 'snooping NET_CALL_TEST data', JSON.stringify(data));
    // add data.stack to pass netDataMulti, netDataReturn
    if (data.stack === undefined) data.stack = [];
    data.stack.push(`DBLOGIC_SNOOP`);
    data.stack.push(`DBLOGIC_SNOOP`);
    // add data.reply to pass netDataAdd
    data.reply = 'DBLOGIC_SNOOP';
    // must return data for promise to return data to handler
    // otherwise returns null
    return data;
  });
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
  console.log('*** START ***');
});

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.Hook('INITIALIZE', () => {
  JSCLI.AddFunction(ncPushDatabase);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ function ncPushDatabase(jsonFile) {
  jsonFile = jsonFile || 'data.reducedlinks.json';
  DATASTORE.PromiseJSONFile(jsonFile)
    .then(data => {
      // data is { nodes, edges }
      console.log(PR, `Sending data from ${jsonFile} to Server`, data);
      // UDATA.Call() returns a promise, so return it to
      // continue the asynchronous chain
      return UDATA.Call('SRV_DBSET', data);
    })
    .then(d => {
      if (d.OK) {
        console.log(
          `${PR} %cServer Database has been overwritten with ${jsonFile}`,
          'color:blue'
        );
        console.log(`${PR} Reload apps to see new data`);
      } else {
        console.error(PR, 'Server Error', d);
      }
    });
  // return syntax help
  return 'FYI: ncPushDatabase(jsonFile) can load file in assets/data';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
