/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading
    eventually will load data from database
    data.json is { nodes: [ {} ... {} ] }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = { load:true };

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
      UDATA.HandleMessage('EDGE_DELETE',( data ) => {
        let { edgeID } = data;
        console.log(PR,'EDGE_DELETE edgeID',edgeID);
        MOD.Update({ op:'delete', edgeID });
      });
    });

/// DB INTERFACE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Placeholder DATA access function
/*/ MOD.Data = function () {
      return D3DATA;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write update to database
/*/ MOD.Update = function( data ) {
      UDATA.Call('SRV_DBUPDATE',data)
      .then((res)=>{
        if (res.OK) {
          console.log(PR,`server db ${data.op}`,data,`success`);
        } else {
          console.log(PR,'error updating server db',res);
        }
      });
    };


/// DATABASE LOADER ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load default data set from a JSON file in /assets/data
/*/ MOD.LoadDataFilePromise = function ( jsonFile ) {
      if (typeof jsonFile!=='string') throw new Error('pass arg <filename_in_assets/data>');
      if (DBG.load) console.log(PR,`loading app/assets/data/${jsonFile} via Promise...`);
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
        xobj.open('GET',`data/${jsonFile}`, true);
        xobj.send();
      });
      return promise;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: (WIP) load database
/*/ MOD.LoadDataPromise = function () {
      // UDATA.Call() returns a promise
      return UDATA.Call('SRV_DBGET',{});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: (WIP) write database from d3data-formatted object
/*/ MOD.OverwriteDataPromise = function ( d3data ) {
      return new Promise((resolve,reject)=>{
        UDATA.Call('SRV_DBSET',d3data)
        .then((res)=>{
          if (res.OK) {
            console.log(PR,`database set OK`);
            resolve(res);
          } else {
            reject(new Error(JSON.stringify(res)));
          }
        });
      });
    };

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
