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
let DSTOR        = UNISYS.NewModule(module.id);
let UDATA         = UNISYS.NewDataLink(DSTOR);
let D3DATA        = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ establish message handlers during INITIALIZE phase
/*/ DSTOR.Hook('INITIALIZE',()=>{
      UDATA.HandleMessage('EDGE_DELETE',( data ) => {
        let { edgeID } = data;
        console.log(PR,'EDGE_DELETE edgeID',edgeID);
        DSTOR.Update({ op:'delete', edgeID });
      });
    });

/// DB INTERFACE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Placeholder DATA access function
/*/ DSTOR.Data = function () {
      return D3DATA;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write update to database
/*/ DSTOR.Update = function( data ) {
      UDATA.Call('SRV_DBUPDATE',data)
      .then((res)=>{
        if (res.OK) {
          console.log(PR,`server db ${data.op}`,data,`success`);
        } else {
          console.log(PR,'error updating server db',res);
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ get a unique NodeID
/*/ DSTOR.PromiseNewNodeID = function() {
      return new Promise((resolve,reject)=>{
        UDATA.NetCall('SRV_DBGETNODEID')
        .then(( data )=>{
          if (data.nodeID) {
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
          if (data.edgeID) resolve(data.edgeID);
          else reject(new Error('unknown error'+JSON.stringify(data)));
        })
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write update to database
/*/ DSTOR.UpdateOrCreateNode = function ( node ) {
      let attribs = {
        'Node_Type'  : node.type,
        'Extra Info' : node.info,
        'Notes'      : node.notes
      };
      let newNode = {
        label        : node.label,
        attributes   : attribs,
        id           : node.id
      };
      // set matching nodes
      let updatedNodes = DSTOR.SetMatchingNodesByProp({id:node.id},newNode);
      if (DBG) console.log('HandleSourceUpdate: updated',updatedNodes);
      // if no nodes had matched, then add a new node!
      if (updatedNodes.length===0) {
        if (DBG) console.log('pushing node',newNode);
        DSTOR.Update({ op:'insert', newNode });
        D3DATA.nodes.push(newNode);
      }
      if (updatedNodes.length===1) {
        // DATASTORE/server-database.json expects a 'node' key not 'newNode' with updates
        if (DBG) console.log('updating existing node',newNode);
        DSTOR.Update({ op:'update', node:newNode });
      }
      if (updatedNodes.length>1) {
        throw Error("SourceUpdate found duplicate IDs");
      }
      UDATA.SetAppState('D3DATA',D3DATA);
  };

/// DATABASE LOADER ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load default data set from a JSON file in /assets/data
/*/ DSTOR.PromiseJSONFile = function ( jsonFile ) {
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
