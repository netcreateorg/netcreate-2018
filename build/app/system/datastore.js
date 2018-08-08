/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading
    eventually will load data from database
    data.json is { nodes: [ {} ... {} ] }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS    = require('settings');
const UNISYS      = require('unisys/client');
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('Datastore');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MOD           = UNISYS.NewModule( module.id );
let DATA          = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Placeholder DATA access function
/*/ MOD.Data = function () {
      return DATA;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Placeholder DATA loader; eventually will talk to the database on the
    server instead of loading manually
/*/ MOD.LoadData = function () {
      if (DBG) console.log(PR,'loading data via Promise...');
      let promise = new Promise((resolve,reject)=>{
        let xobj = new XMLHttpRequest();
        xobj.addEventListener('load',(event)=>{
          if (event.target.status===404) {
            reject(Error(`file not found`));
            return;
          }
          let data = event.target.responseText;
          DATA = Object.assign(DATA,JSON.parse(data));
          if (DBG) console.log(PR,'...data loaded!');
          resolve(DATA);
        });
        xobj.open('GET','data/data.reducedlinks.json', true);
        xobj.send();
      });
      return promise;
    };

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
