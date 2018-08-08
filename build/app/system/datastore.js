/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading
    eventually will load data from database
    data.json is { nodes: [ {} ... {} ] }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = { load:false };

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS    = require('settings');
const UNISYS      = require('unisys/client');
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('Datastore');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MOD           = UNISYS.NewModule(module.id);
let UDATA         = UNISYS.NewDataLink(MOD);
let D3DATA        = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ establish message handlers during INITIALIZE phase
/*/ MOD.Hook('INITIALIZE',()=>{
      UDATA.HandleMessage('SOURCE_UPDATE',( node ) => {
        console.log(PR,'SOURCE_UPDATE node',node);
      });
      UDATA.HandleMessage('EDGE_UPDATE',( edge ) => {
        console.log(PR,'EDGE_UPDATE edge',edge);
      });
      UDATA.HandleMessage('EDGE_DELETE',( edgeID ) => {
        console.log(PR,'EDGE_DELETE edgeID',edgeID);
      });
    });

/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Placeholder DATA access function
/*/ MOD.Data = function () {
      return D3DATA;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Load default data set from a JSON file
/*/ MOD.LoadDefaultDataPromise = function () {
      if (DBG.load) console.log(PR,'loading data via Promise...');
      let promise = new Promise((resolve,reject)=>{
        let xobj = new XMLHttpRequest();
        xobj.addEventListener('load',(event)=>{
          if (event.target.status===404) {
            reject(new Error(`file not found`));
            return;
          }
          let data = event.target.responseText;
          D3DATA = Object.assign(D3DATA,JSON.parse(data));
          if (DBG.load) console.log(PR,'...data loaded!');
          resolve(D3DATA);
        });
        xobj.open('GET','data/data.reducedlinks.json', true);
        xobj.send();
      });
      return promise;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Placeholder DATA loader; eventually will talk to the database on the
    server instead of loading manually
/*/ MOD.LoadDataPromise = MOD.LoadDefaultDataPromise;

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
