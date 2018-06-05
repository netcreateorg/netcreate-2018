/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading
    eventually will load data from database
    data.json is { nodes: [ {} ... {} ] }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = require('settings');
const UNISYS   = require('system/unisys');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MOD        = UNISYS.NewModule( module.id );
let DATA       = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ MOD.Hook('LOADASSETS', function () {
      let promise = new Promise((resolve,reject)=>{
        let xobj = new XMLHttpRequest();
        xobj.addEventListener('load',(event)=>{
          if (event.target.status==404) {
            reject('file not found');
            return;
          }
          let data = event.target.responseText;
          DATA = Object.assign(DATA,JSON.parse(data));
          resolve();
        });
        xobj.open('GET','/htmldemos/d3forcedemo/data.json', true);
        xobj.send();
      });
      return promise;
    }); // LOADASSETS

/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Placeholder DATA access function
/*/ MOD.Data = function () {
      return DATA;
    };


/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
