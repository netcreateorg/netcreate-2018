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
const SESSION     = require('unisys/common-session');
const UNISYS      = require('unisys/client');
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('Datastore');
const NetMessage  = require('unisys/common-netmessage-class');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HASH_ABET   = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DSTOR         = UNISYS.NewModule(module.id);
let UDATA         = UNISYS.NewDataLink(DSTOR);
let D3DATA        = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ establish message handlers during INITIALIZE phase
/*/ DSTOR.Hook('INITIALIZE',()=>{
      UDATA.HandleMessage('DB_UPDATE', function( data ) {
        DSTOR.UpdateServerDB(data);
      });
      UDATA.HandleMessage('GROUPID_CHANGE', function( data ) {
        DSTOR.SetSessionGroupID(data);
      });
    });


/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ datastore needs to set NetMessage GroupID property on behalf of SESSIONS
    because SESSION can't include NetMessage (or vice versa)
/*/ DSTOR.SetSessionGroupID = function ( token ) {
      let good = SESSION.DecodeToken(token).isValid;
      if (good) {
        NetMessage.GlobalSetGroupID(token);
        console.log('setting NetMessage group id',token);
      } else {
        console.warn('will not set bad group id:',token);
      }
    }

/// DB INTERFACE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Placeholder DATA access function
/*/ DSTOR.Data = function () {
      return D3DATA;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write update to database
/*/ DSTOR.UpdateServerDB = function( data ) {
      UDATA.Call('SRV_DBUPDATE',data)
      .then((res)=>{
        if (res.OK) {
          console.log(PR,`server db transaction`,data,`success`);
        } else {
          console.log(PR,'error updating server db',res);
        }
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ get a unique NodeID
/*/ DSTOR.PromiseNewNodeID = function() {
      return new Promise((resolve,reject)=>{
        UDATA.NetCall('SRV_DBGETNODEID')
        .then(( data )=>{
          if (data.nodeID) {
            if (DBG) console.log(PR,'server allocated node_id',data.nodeID);
            resolve(data.nodeID);
          } else {
            reject(new Error('unknown error'+JSON.stringify(data)));
          }
        })
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ get a unique Edge
/*/ DSTOR.PromiseNewEdgeID = function() {
      return new Promise((resolve,reject)=>{
        UDATA.NetCall('SRV_DBGETEDGEID')
        .then(( data )=>{
          if (data.edgeID) {
            if (DBG) console.log(PR,'server allocated edge_id:',data.edgeID);
            resolve(data.edgeID);
          } else {
            reject(new Error('unknown error'+JSON.stringify(data)));
          }
        })
      });
    };

/// DATABASE LOADER ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load default data set from a JSON file in /assets/data
/*/ DSTOR.PromiseJSONFile = function ( jsonFile ) {
      if (typeof jsonFile!=='string') throw new Error('pass arg <filename_in_assets/data>');
      let promise = new Promise((resolve,reject)=>{
        let xobj = new XMLHttpRequest();
        xobj.addEventListener('load',(event)=>{
          if (event.target.status===404) {
            reject(new Error(`file not found`));
            return;
          }
          let data = event.target.responseText;
          D3DATA = Object.assign(D3DATA,JSON.parse(data));
          resolve(D3DATA);
        });
        xobj.open('GET',`data/${jsonFile}`, true);
        xobj.send();
      });
      return promise;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load D3 Database
/*/ DSTOR.PromiseD3Data = function () {
      // UDATA.Call() returns a promise
      return UDATA.Call('SRV_DBGET',{});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: (WIP) write database from d3data-formatted object
/*/ DSTOR.OverwriteDataPromise = function ( d3data ) {
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
module.exports = DSTOR;
